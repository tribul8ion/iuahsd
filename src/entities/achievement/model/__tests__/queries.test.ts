import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { achievementKeys, useAchievements } from "../queries";
import { apiClient } from "@/shared/api";
import { createErrorResponse, createSuccessResponse } from "@/test/mocks/handlers";
import type { EarnedAchievement } from "../types";

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

const earned: EarnedAchievement[] = [
  { achievement_id: "first_step", earned_at: "2026-04-01T08:00:00Z" },
  { achievement_id: "combo_5", earned_at: "2026-04-03T08:00:00Z" },
];

describe("achievementKeys", () => {
  it("generates base and list keys", () => {
    expect(achievementKeys.all).toEqual(["achievements"]);
    expect(achievementKeys.list()).toEqual(["achievements", "list"]);
  });
});

describe("useAchievements", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches earned achievements from /achievements", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse({ earned }));

    const { result } = renderHook(() => useAchievements(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/achievements");
    expect(result.current.data).toEqual(earned);
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(createErrorResponse("Server error"));

    const { result } = renderHook(() => useAchievements(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Server error");
  });
});
