import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useDeleteAccount } from "../use-delete-account";
import { apiClient } from "@/shared/api";
import { clearKey } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { hapticFeedback } from "@/shared/lib";
import {
  createSuccessResponse,
  createErrorResponse,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/crypto")>();
  return {
    ...actual,
    clearKey: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/shared/lib", () => ({
  hapticFeedback: vi.fn(),
}));

function createTestEnv() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

describe("useDeleteAccount", () => {
  const originalTelegram = window.Telegram;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "Telegram", {
      configurable: true,
      writable: true,
      value: { WebApp: { close: vi.fn() } },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "Telegram", {
      configurable: true,
      writable: true,
      value: originalTelegram,
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it("calls DELETE to /me, wipes the key and query cache, then closes WebApp", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createSuccessResponse({ deleted: true })
    );
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });

    const { queryClient, wrapper } = createTestEnv();
    queryClient.setQueryData(["any-key"], { value: 1 });
    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith("/me", true);
    expect(clearKey).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().cryptoKey).toBeNull();
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(hapticFeedback).toHaveBeenCalledWith("notification", "success");
    expect(window.Telegram?.WebApp?.close).toHaveBeenCalledTimes(1);
  });

  it("falls back to window.location.reload when WebApp.close is unavailable", async () => {
    Object.defineProperty(window, "Telegram", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...window.location, reload: reloadMock },
    });

    vi.mocked(apiClient.delete).mockResolvedValue(
      createSuccessResponse({ deleted: true })
    );

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("triggers error haptic when delete fails", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createErrorResponse("Forbidden")
    );

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Forbidden");
    expect(hapticFeedback).toHaveBeenCalledWith("notification", "error");
    expect(clearKey).not.toHaveBeenCalled();
  });
});
