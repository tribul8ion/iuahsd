import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AchievementsShelf } from "../AchievementsShelf";
import { apiClient } from "@/shared/api";
import { createSuccessResponse } from "@/test/mocks/handlers";
import type { EarnedAchievement } from "@/entities/achievement";

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && "count" in vars && "total" in vars) {
        return `${vars.count}/${vars.total}`;
      }
      return key;
    },
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("AchievementsShelf", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the earned-count progress out of all 42 catalog badges", async () => {
    const earned: EarnedAchievement[] = [
      { achievement_id: "first_step", earned_at: "2026-04-01T08:00:00Z" },
      { achievement_id: "combo_5", earned_at: "2026-04-02T08:00:00Z" },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse({ earned }));

    render(<AchievementsShelf />, { wrapper: createWrapper() });

    expect(await screen.findByText("2/42")).toBeInTheDocument();
  });

  it("renders all badges, marking earned vs locked distinctly", async () => {
    const earned: EarnedAchievement[] = [
      { achievement_id: "first_step", earned_at: "2026-04-01T08:00:00Z" },
    ];
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse({ earned }));

    render(<AchievementsShelf />, { wrapper: createWrapper() });

    const earnedTile = (await screen.findByText("achievements.badges.first_step.name"))
      .closest("div");
    expect(earnedTile).toHaveStyle({ opacity: "1" });
    expect(
      screen.queryByText("achievements.badges.first_step.condition")
    ).not.toBeInTheDocument();

    const lockedName = screen.getByText("achievements.badges.combo_5.name");
    const lockedTile = lockedName.closest("div");
    expect(lockedTile).toHaveStyle({ opacity: "0.55" });
    expect(screen.getByText("achievements.badges.combo_5.condition")).toBeInTheDocument();
  });
});
