import { apiClient } from "../client";
import { API_URL } from "@/shared/config";
import {
  loadSessionToken,
  saveSessionToken,
  useSessionStore,
} from "@/shared/session";
import { createSuccessResponse, mockEntries } from "@/test/mocks/handlers";

const { retrieveRawInitDataMock, retrieveLaunchParamsMock } = vi.hoisted(() => ({
  retrieveRawInitDataMock: vi.fn<() => string | undefined>(),
  retrieveLaunchParamsMock: vi.fn<() => unknown>(),
}));

vi.mock("@telegram-apps/sdk-react", () => ({
  retrieveRawInitData: () => retrieveRawInitDataMock(),
  retrieveLaunchParams: () => retrieveLaunchParamsMock(),
}));

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  retrieveRawInitDataMock.mockReturnValue("raw_init_data");
  retrieveLaunchParamsMock.mockReturnValue({
    tgWebAppData: { user: { id: 111 } },
  });
  localStorage.clear();
  useSessionStore.setState({ cryptoKey: null, bootState: "boot" });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function jsonOk(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response;
}

function jsonErr(status: number, body: unknown): Response {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function sessionEnvelope(token: string): unknown {
  return { success: true, data: { token, expires_in: 3600 }, error: null };
}

interface Routes {
  session?: () => Response;
  data?: () => Response;
}

function mockRoutes(routes: Routes): void {
  vi.mocked(fetch).mockImplementation((input: unknown) => {
    const url = String(input);
    if (url.endsWith("/auth/session")) {
      return Promise.resolve(
        routes.session ? routes.session() : jsonOk(sessionEnvelope("token"))
      );
    }
    return Promise.resolve(
      routes.data ? routes.data() : jsonOk(createSuccessResponse(null))
    );
  });
}

function fetchCalls(): Array<[string, RequestInit]> {
  return vi.mocked(fetch).mock.calls as unknown as Array<[string, RequestInit]>;
}

function urlAt(index: number): string {
  return String(fetchCalls()[index][0]);
}

function authAt(index: number): string | undefined {
  return (fetchCalls()[index][1].headers as Record<string, string>).Authorization;
}

function lastRequestHeaders(): Record<string, string> {
  return fetchCalls()[0][1].headers as Record<string, string>;
}

describe("apiClient", () => {
  describe("authorization header", () => {
    it("falls back to dev identity outside Telegram when VITE_DEV_TELEGRAM_ID is set", async () => {
      retrieveRawInitDataMock.mockImplementation(() => {
        throw new Error("not in telegram");
      });
      vi.stubEnv("VITE_DEV_TELEGRAM_ID", "123456789");
      vi.mocked(fetch).mockResolvedValue(jsonOk(createSuccessResponse(null)));

      await apiClient.get("/me");

      expect(lastRequestHeaders().Authorization).toBe("tma dev:123456789");
    });

    it("omits Authorization when init data and dev id are unavailable", async () => {
      retrieveRawInitDataMock.mockReturnValue(undefined);
      vi.stubEnv("VITE_DEV_TELEGRAM_ID", "");
      vi.mocked(fetch).mockResolvedValue(jsonOk(createSuccessResponse(null)));

      await apiClient.get("/me");

      expect(lastRequestHeaders().Authorization).toBeUndefined();
    });
  });

  describe("content-type header", () => {
    it("sends application/json content-type", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonOk(createSuccessResponse(null)));

      await apiClient.get("/test");

      expect(lastRequestHeaders()["Content-Type"]).toBe("application/json");
    });
  });

  describe("session token flow", () => {
    it("exchanges init data for a session token, then sends Bearer", async () => {
      mockRoutes({ session: () => jsonOk(sessionEnvelope("sess_token")) });

      await apiClient.get("/me");

      expect(urlAt(0)).toBe(`${API_URL}/auth/session`);
      expect(fetchCalls()[0][1].method).toBe("POST");
      expect(authAt(0)).toBe("tma raw_init_data");
      expect(urlAt(1)).toBe(`${API_URL}/me`);
      expect(authAt(1)).toBe("Bearer sess_token");
    });

    it("persists the exchanged token with the current telegram id", async () => {
      mockRoutes({ session: () => jsonOk(sessionEnvelope("sess_token")) });

      await apiClient.get("/me");

      expect(loadSessionToken()).toEqual({
        token: "sess_token",
        telegramId: 111,
      });
    });

    it("uses a stored token directly without exchanging", async () => {
      saveSessionToken({ token: "stored_token", telegramId: 111 });
      mockRoutes({});

      await apiClient.get("/me");

      expect(fetchCalls()).toHaveLength(1);
      expect(urlAt(0)).toBe(`${API_URL}/me`);
      expect(authAt(0)).toBe("Bearer stored_token");
    });

    it("re-exchanges and retries once when a Bearer request returns 401", async () => {
      saveSessionToken({ token: "old_token", telegramId: 111 });
      let dataCalls = 0;
      vi.mocked(fetch).mockImplementation((input: unknown) => {
        const url = String(input);
        if (url.endsWith("/auth/session")) {
          return Promise.resolve(jsonOk(sessionEnvelope("fresh_token")));
        }
        dataCalls += 1;
        if (dataCalls === 1) {
          return Promise.resolve(jsonErr(401, { error: "invalid_session" }));
        }
        return Promise.resolve(jsonOk(createSuccessResponse({ ok: true })));
      });

      const result = await apiClient.get("/me");

      expect(result.success).toBe(true);
      expect(useSessionStore.getState().bootState).toBe("boot");
      expect(fetchCalls().map((_, i) => authAt(i))).toEqual([
        "Bearer old_token",
        "tma raw_init_data",
        "Bearer fresh_token",
      ]);
    });

    it("marks error without looping when re-exchange also returns 401", async () => {
      saveSessionToken({ token: "old_token", telegramId: 111 });
      vi.mocked(fetch).mockImplementation((input: unknown) => {
        const url = String(input);
        if (url.endsWith("/auth/session")) {
          return Promise.resolve(jsonErr(401, { error: "invalid_init_data" }));
        }
        return Promise.resolve(jsonErr(401, { error: "invalid_session" }));
      });

      const result = await apiClient.get("/me");

      expect(useSessionStore.getState().bootState).toBe("error");
      expect(result.success).toBe(false);
      const dataCalls = fetchCalls().filter(([url]) => String(url).endsWith("/me"));
      expect(dataCalls).toHaveLength(1);
    });

    it("clears a stored token whose telegram id differs and exchanges anew", async () => {
      saveSessionToken({ token: "other_user_token", telegramId: 999 });
      mockRoutes({ session: () => jsonOk(sessionEnvelope("my_token")) });

      await apiClient.get("/me");

      expect(urlAt(0)).toBe(`${API_URL}/auth/session`);
      expect(authAt(1)).toBe("Bearer my_token");
      expect(loadSessionToken()).toEqual({ token: "my_token", telegramId: 111 });
    });

    it("performs a single session exchange for concurrent requests", async () => {
      mockRoutes({ session: () => jsonOk(sessionEnvelope("shared_token")) });

      await Promise.all([
        apiClient.get("/a"),
        apiClient.get("/b"),
        apiClient.get("/c"),
      ]);

      const sessionCalls = fetchCalls().filter(([url]) =>
        String(url).endsWith("/auth/session")
      );
      expect(sessionCalls).toHaveLength(1);
    });

    it("re-exchanges only once for concurrent Bearer requests that all get 401", async () => {
      saveSessionToken({ token: "old_token", telegramId: 111 });
      const seen = new Set<string>();
      vi.mocked(fetch).mockImplementation((input: unknown) => {
        const url = String(input);
        if (url.endsWith("/auth/session")) {
          return Promise.resolve(jsonOk(sessionEnvelope("fresh_token")));
        }
        if (!seen.has(url)) {
          seen.add(url);
          return Promise.resolve(jsonErr(401, { error: "invalid_session" }));
        }
        return Promise.resolve(jsonOk(createSuccessResponse({ ok: true })));
      });

      const results = await Promise.all([
        apiClient.get("/a"),
        apiClient.get("/b"),
        apiClient.get("/c"),
      ]);

      expect(results.every((result) => result.success)).toBe(true);
      const sessionCalls = fetchCalls().filter(([url]) =>
        String(url).endsWith("/auth/session")
      );
      expect(sessionCalls).toHaveLength(1);
    });

    it("neither uses nor clears a stored token when the current id is unavailable", async () => {
      saveSessionToken({ token: "stored_token", telegramId: 111 });
      retrieveRawInitDataMock.mockReturnValue(undefined);
      retrieveLaunchParamsMock.mockImplementation(() => {
        throw new Error("not in telegram");
      });
      vi.stubEnv("VITE_DEV_TELEGRAM_ID", "");
      vi.mocked(fetch).mockResolvedValue(jsonOk(createSuccessResponse(null)));

      await apiClient.get("/me");

      expect(fetchCalls()).toHaveLength(1);
      expect(authAt(0)).toBeUndefined();
      expect(loadSessionToken()).toEqual({
        token: "stored_token",
        telegramId: 111,
      });
    });

    it("exchanges rather than using a stored token when the current id is unavailable", async () => {
      saveSessionToken({ token: "stored_token", telegramId: 111 });
      retrieveLaunchParamsMock.mockImplementation(() => {
        throw new Error("not in telegram");
      });
      vi.stubEnv("VITE_DEV_TELEGRAM_ID", "");
      mockRoutes({ session: () => jsonOk(sessionEnvelope("fresh_token")) });

      await apiClient.get("/me");

      expect(urlAt(0)).toBe(`${API_URL}/auth/session`);
      expect(authAt(1)).toBe("Bearer fresh_token");
    });

    it("continues without a token when localStorage is unavailable", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      mockRoutes({ session: () => jsonOk(sessionEnvelope("sess")) });

      const result = await apiClient.get("/me");

      expect(result.success).toBe(true);
      expect(urlAt(0)).toBe(`${API_URL}/auth/session`);
      expect(authAt(1)).toBe("Bearer sess");
    });
  });

  describe("successful responses", () => {
    it("returns parsed json on success", async () => {
      const expected = createSuccessResponse(mockEntries);
      vi.mocked(fetch).mockResolvedValue(jsonOk(expected));

      const result = await apiClient.get("/medications");

      expect(result).toEqual(expected);
    });
  });

  describe("error responses", () => {
    it("returns error response with server error message", async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonErr(400, { error: "Validation failed" })
      );

      const result = await apiClient.get("/medications");

      expect(result).toEqual({
        success: false,
        data: null,
        error: "Validation failed",
      });
    });

    it("returns fallback error message when body is not json", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      } as Response);

      const result = await apiClient.get("/test");

      expect(result).toEqual({
        success: false,
        data: null,
        error: "Request failed with status 500",
      });
    });

    it("does not touch boot state on non-401 errors", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonErr(403, { error: "forbidden" }));

      await apiClient.get("/medications");

      expect(useSessionStore.getState().bootState).toBe("boot");
    });
  });

  describe("401 handling", () => {
    it("marks the session as errored without closing the WebApp", async () => {
      const close = vi.fn();
      vi.stubGlobal("window", Object.assign(window, {
        Telegram: { WebApp: { close } },
      }));
      vi.mocked(fetch).mockResolvedValue(
        jsonErr(401, { error: "invalid_init_data" })
      );

      const result = await apiClient.get("/me");

      expect(close).not.toHaveBeenCalled();
      expect(useSessionStore.getState().bootState).toBe("error");
      expect(result.success).toBe(false);
      expect(result.error).toBe("invalid_init_data");

      (window as { Telegram?: unknown }).Telegram = undefined;
    });

    it("reports the error state when the WebApp bridge is unavailable", async () => {
      (window as { Telegram?: unknown }).Telegram = undefined;
      vi.mocked(fetch).mockResolvedValue(
        jsonErr(401, { error: "missing_authorization" })
      );

      const result = await apiClient.get("/me");

      expect(useSessionStore.getState().bootState).toBe("error");
      expect(result.error).toBe("missing_authorization");
    });
  });

  describe("HTTP methods", () => {
    beforeEach(() => {
      vi.mocked(fetch).mockResolvedValue(jsonOk(createSuccessResponse(null)));
    });

    it("sends GET request", async () => {
      await apiClient.get("/medications");

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/medications`,
        expect.objectContaining({ method: "GET" })
      );
    });

    it("sends POST request with body", async () => {
      const payload = { schedule: "morning", time: "08:00" };
      await apiClient.post("/medications", payload);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/medications`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
    });

    it("sends POST request without body", async () => {
      await apiClient.post("/checklist/10/mark-taken");

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/checklist/10/mark-taken`,
        expect.objectContaining({
          method: "POST",
          body: undefined,
        })
      );
    });

    it("sends PUT request with body", async () => {
      const payload = { active: false };
      await apiClient.put("/medications/1", payload);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/medications/1`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );
    });

    it("sends PATCH request with body", async () => {
      const payload = { timezone: "Europe/Helsinki" };
      await apiClient.patch("/settings", payload);

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/settings`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      );
    });

    it("sends DELETE request", async () => {
      await apiClient.delete("/medications/1");

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/medications/1`,
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("request URL construction", () => {
    it("prepends API_URL to the endpoint", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonOk(createSuccessResponse(null)));

      await apiClient.get("/checklist/today");

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/checklist/today`,
        expect.any(Object)
      );
    });
  });
});
