import {
  retrieveLaunchParams,
  retrieveRawInitData,
} from "@telegram-apps/sdk-react";
import { API_URL, PREVIEW_MODE } from "@/shared/config";
import { previewRequest } from "./preview";
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
  useSessionStore,
} from "@/shared/session";
import type { ApiResponse } from "./types";

interface ParsedResponse<T> {
  ok: boolean;
  status: number;
  body: ApiResponse<T> | { error?: string } | null;
  parseFailed: boolean;
}

interface AuthContext {
  header: string;
  bearer: boolean;
}

interface SessionTokenData {
  token: string;
}

function rawInitData(): string | undefined {
  try {
    return retrieveRawInitData();
  } catch {
    return undefined;
  }
}

function devTelegramId(): string | undefined {
  const id = import.meta.env.VITE_DEV_TELEGRAM_ID;
  if (import.meta.env.DEV && id) {
    return id;
  }
  return undefined;
}

function tmaHeader(): string | null {
  const raw = rawInitData();
  if (raw) {
    return `tma ${raw}`;
  }
  const dev = devTelegramId();
  if (dev) {
    return `tma dev:${dev}`;
  }
  return null;
}

function currentTelegramId(): number | null {
  try {
    const params = retrieveLaunchParams(true);
    const id = params.tgWebAppData?.user?.id;
    if (typeof id === "number") {
      return id;
    }
  } catch {
    void 0;
  }
  const dev = devTelegramId();
  if (dev) {
    const parsed = Number(dev);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

let exchangeInFlight: Promise<string | null> | null = null;

async function exchangeSession(): Promise<string | null> {
  if (exchangeInFlight) {
    return exchangeInFlight;
  }
  const header = tmaHeader();
  if (!header) {
    return null;
  }
  exchangeInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: header,
        },
      });
      if (!response.ok) {
        return null;
      }
      const body = (await response.json()) as ApiResponse<SessionTokenData>;
      const token = body?.success ? body.data?.token : undefined;
      if (!token) {
        return null;
      }
      saveSessionToken({ token, telegramId: currentTelegramId() });
      return token;
    } catch {
      return null;
    } finally {
      exchangeInFlight = null;
    }
  })();
  return exchangeInFlight;
}

async function resolveAuth(): Promise<AuthContext | null> {
  const stored = loadSessionToken();
  if (stored) {
    const current = currentTelegramId();
    if (stored.telegramId !== null && stored.telegramId === current) {
      return { header: `Bearer ${stored.token}`, bearer: true };
    }
    if (current !== null && stored.telegramId !== null && stored.telegramId !== current) {
      clearSessionToken();
    }
  }

  const token = await exchangeSession();
  if (token) {
    return { header: `Bearer ${token}`, bearer: true };
  }
  return null;
}

function stepUpHeader(): string | null {
  const raw = rawInitData();
  if (raw) {
    return raw;
  }
  const dev = devTelegramId();
  return dev ? `dev:${dev}` : null;
}

function handleUnauthorized(): void {
  useSessionStore.getState().setBootState("error");
}

function isReauthError<T>(parsed: ParsedResponse<T>): boolean {
  const error = (parsed.body as { error?: string } | null)?.error;
  return error === "reauth_required";
}

async function parseResponse<T>(response: Response): Promise<ParsedResponse<T>> {
  let body: ApiResponse<T> | { error?: string } | null = null;
  let parseFailed = false;
  try {
    body = (await response.json()) as ApiResponse<T> | { error?: string };
  } catch {
    parseFailed = true;
  }
  return { ok: response.ok, status: response.status, body, parseFailed };
}

function toEnvelope<T>(parsed: ParsedResponse<T>): ApiResponse<T> {
  if (!parsed.ok) {
    if (parsed.parseFailed || parsed.body === null) {
      return {
        success: false,
        data: null,
        error: `Request failed with status ${parsed.status}`,
      };
    }
    const errorField = (parsed.body as { error?: string }).error;
    return {
      success: false,
      data: null,
      error: errorField ?? `Request failed with status ${parsed.status}`,
    };
  }

  if (parsed.parseFailed) {
    return {
      success: false,
      data: null,
      error: "Failed to parse server response",
    };
  }

  if (
    parsed.body &&
    typeof parsed.body === "object" &&
    "success" in parsed.body
  ) {
    return parsed.body as ApiResponse<T>;
  }

  return { success: true, data: parsed.body as T, error: null };
}

function send(
  endpoint: string,
  options: RequestInit,
  auth: AuthContext | null,
  stepUp: boolean
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (auth) {
    headers.Authorization = auth.header;
  }
  if (stepUp) {
    const initData = stepUpHeader();
    if (initData) {
      headers["X-Telegram-Init-Data"] = initData;
    }
  }
  return fetch(`${API_URL}${endpoint}`, { ...options, headers });
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  stepUp = false
): Promise<ApiResponse<T>> {
  if (PREVIEW_MODE) {
    return previewRequest<T>(endpoint, options);
  }
  const auth = await resolveAuth();
  const response = await send(endpoint, options, auth, stepUp);
  let parsed = await parseResponse<T>(response);

  if (parsed.status === 401 && !isReauthError(parsed)) {
    if (auth?.bearer) {
      clearSessionToken();
      const token = await exchangeSession();
      if (token) {
        const retry = await send(
          endpoint,
          options,
          { header: `Bearer ${token}`, bearer: true },
          stepUp
        );
        parsed = await parseResponse<T>(retry);
        if (parsed.status === 401 && !isReauthError(parsed)) {
          handleUnauthorized();
        }
      } else {
        handleUnauthorized();
      }
    } else {
      handleUnauthorized();
    }
  }

  return toEnvelope<T>(parsed);
}

export const apiClient = {
  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "GET" });
  },

  post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, stepUp = false): Promise<ApiResponse<T>> {
    return request<T>(
      endpoint,
      {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
      },
      stepUp
    );
  },

  patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, stepUp = false): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: "DELETE" }, stepUp);
  },
};
