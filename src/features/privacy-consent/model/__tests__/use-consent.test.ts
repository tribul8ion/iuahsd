import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useConsent } from "../use-consent";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import type { User } from "@/entities/user";
import {
  createSuccessResponse,
  createErrorResponse,
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

const cachedUser: User = {
  id: 1,
  telegram_id: 123456789,
  language: "en",
  is_admin: false,
  created_at: null,
  last_active: null,
  medications_count: 0,
  entries_count: 0,
  crypto_initialized: false,
  current_policy_version: "2.0",
  last_accepted_policy_version: "1.0",
  needs_consent_refresh: true,
};

function createTestEnv() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(userKeys.me(), cachedUser);

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

describe("useConsent", () => {
  afterEach(() => vi.clearAllMocks());

  it("posts consent for the given policy version", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse({ recorded: true, needs_consent_refresh: false })
    );

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useConsent(), { wrapper });

    await act(async () => {
      result.current.mutate("2.0");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.post).toHaveBeenCalledWith("/me/consent", {
      policy_version: "2.0",
      consent_type: "privacy_policy",
      accepted: true,
      source: "miniapp",
    });
  });

  it("updates the cached profile after consent is recorded", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse({ recorded: true, needs_consent_refresh: false })
    );

    const { queryClient, wrapper } = createTestEnv();
    const { result } = renderHook(() => useConsent(), { wrapper });

    await act(async () => {
      result.current.mutate("2.0");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<User>(userKeys.me());
    expect(cached?.needs_consent_refresh).toBe(false);
    expect(cached?.last_accepted_policy_version).toBe("2.0");
  });

  it("throws when the server rejects the consent", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      createErrorResponse("validation_error")
    );

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useConsent(), { wrapper });

    await act(async () => {
      result.current.mutate("2.0");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("validation_error");
  });
});
