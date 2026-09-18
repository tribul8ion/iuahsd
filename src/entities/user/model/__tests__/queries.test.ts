import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { userKeys, useCurrentUser, useUserSettings } from "../queries";
import { apiClient } from "@/shared/api";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/test/mocks/handlers";
import type { User, UserSettings } from "../types";

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const mockUser: User = {
  id: 1,
  telegram_id: 123456789,
  language: "en",
  is_admin: false,
  created_at: "2026-01-01T00:00:00Z",
  last_active: "2026-04-10T00:00:00Z",
  medications_count: 2,
  entries_count: 2,
  crypto_initialized: true,
  current_policy_version: "1.0",
  last_accepted_policy_version: "1.0",
  needs_consent_refresh: false,
};

const mockSettings: UserSettings = {
  reminders_enabled: true,
  reminder_repeat_minutes: 30,
  muted_today: false,
  language: "en",
  timezone: "Europe/Helsinki",
};

describe("userKeys", () => {
  it("generates base key", () => {
    expect(userKeys.all).toEqual(["user"]);
  });

  it("generates me key", () => {
    expect(userKeys.me()).toEqual(["user", "me"]);
  });

  it("generates settings key", () => {
    expect(userKeys.settings()).toEqual(["user", "settings"]);
  });
});

describe("useCurrentUser", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches current user from /me endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse(mockUser));

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/me");
    expect(result.current.data).toEqual(mockUser);
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createErrorResponse("Unauthorized")
    );

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Unauthorized");
  });

  it("throws fallback message when error is null", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      data: null,
      error: null,
    });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch user");
  });
});

describe("useUserSettings", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches user settings from /settings endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse(mockSettings)
    );

    const { result } = renderHook(() => useUserSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/settings");
    expect(result.current.data).toEqual(mockSettings);
  });

  it("throws when settings response fails", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createErrorResponse("Server error")
    );

    const { result } = renderHook(() => useUserSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Server error");
  });
});
