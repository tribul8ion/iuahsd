import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { LadderSection } from "../LadderSection";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";
import type { Entry } from "@/entities/entry";
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
      if (vars && "current" in vars && "target" in vars) {
        return `${vars.current}/${vars.target} — to "${vars.name}" ${vars.remaining}d`;
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

const coffeeHabit: Entry = {
  ...mockEntries[2],
  id: 5,
  kind: "habit",
  tag: "coffee",
  streak_current: 21,
  streak_best: 21,
};

function mockApi(entries: Entry[], earned: EarnedAchievement[] = []) {
  vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
    if (path === "/entries") {
      const dtos = await Promise.all(entries.map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    }
    if (path === "/achievements") return createSuccessResponse({ earned });
    throw new Error(`unexpected path ${path}`);
  });
}

describe("LadderSection", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when the user has no tagged habits", async () => {
    mockApi([mockEntries[0]]);

    const { container } = render(<LadderSection />, { wrapper: createWrapper() });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a ladder card only for tags with a habit", async () => {
    mockApi([mockEntries[0], coffeeHabit]);

    render(<LadderSection />, { wrapper: createWrapper() });

    expect(await screen.findByTestId("ladder-coffee")).toBeInTheDocument();
    expect(screen.queryByTestId("ladder-water")).not.toBeInTheDocument();
  });

  it("shows the progress line toward the next unearned stage", async () => {
    mockApi([coffeeHabit], [{ achievement_id: "coffee_7", earned_at: "2026-01-01T00:00:00Z" }]);

    render(<LadderSection />, { wrapper: createWrapper() });

    expect(await screen.findByText('21/30 — to "achievements.badges.coffee_30.name" 9d')).toBeInTheDocument();
  });

  it("uses streak_best (not the reset current streak) to compute progress", async () => {
    const laps: Entry = { ...coffeeHabit, streak_current: 0, streak_best: 40 };
    mockApi([laps], [
      { achievement_id: "coffee_7", earned_at: "2026-01-01T00:00:00Z" },
      { achievement_id: "coffee_30", earned_at: "2026-01-05T00:00:00Z" },
    ]);

    render(<LadderSection />, { wrapper: createWrapper() });

    await screen.findByTestId("ladder-coffee");
    expect(
      screen.getByText('40/100 — to "achievements.badges.coffee_100.name" 60d')
    ).toBeInTheDocument();
  });

  it("shows the complete message once every stage is earned", async () => {
    const allEarned: EarnedAchievement[] = ["coffee_7", "coffee_30", "coffee_100", "coffee_365"].map(
      (id) => ({ achievement_id: id as EarnedAchievement["achievement_id"], earned_at: "2026-01-01T00:00:00Z" })
    );
    mockApi([{ ...coffeeHabit, streak_best: 400 }], allEarned);

    render(<LadderSection />, { wrapper: createWrapper() });

    expect(await screen.findByText("game.ladder_complete")).toBeInTheDocument();
  });
});
