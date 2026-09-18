import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useChangeLanguage } from "../use-change-language";
import { apiClient } from "@/shared/api";
import { createSuccessResponse, createErrorResponse } from "@/test/mocks/handlers";

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/lib", () => ({
  hapticFeedback: vi.fn(),
}));

const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: "ru",
      changeLanguage: mockChangeLanguage,
    },
    t: (key: string) => key,
  }),
}));

const mockSetLanguage = vi.fn();
vi.mock("@/entities/user", () => ({
  useUserStore: (selector: (s: { setLanguage: typeof mockSetLanguage }) => unknown) =>
    selector({ setLanguage: mockSetLanguage }),
  userKeys: {
    all: ["user"] as const,
    me: () => ["user", "me"] as const,
    settings: () => ["user", "settings"] as const,
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

describe("useChangeLanguage", () => {
  afterEach(() => vi.clearAllMocks());

  it("changes language via PATCH /settings", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse(undefined)
    );

    const { result } = renderHook(() => useChangeLanguage(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("en");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.patch).toHaveBeenCalledWith("/settings", { language: "en" });
  });

  it("updates i18n and store optimistically", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse(undefined)
    );

    const { result } = renderHook(() => useChangeLanguage(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("en");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    expect(mockSetLanguage).toHaveBeenCalledWith("en");
  });

  it("rolls back on error", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createErrorResponse("Server error")
    );

    const { result } = renderHook(() => useChangeLanguage(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("en");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockChangeLanguage).toHaveBeenCalledWith("ru");
    expect(mockSetLanguage).toHaveBeenCalledWith("ru");
  });
});
