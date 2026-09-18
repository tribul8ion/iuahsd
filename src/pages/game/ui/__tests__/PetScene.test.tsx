import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { PetScene } from "../PetScene";
import { apiClient } from "@/shared/api";
import { createSuccessResponse } from "@/test/mocks/handlers";
import type { PetDto } from "@/entities/pet";
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
      if (vars && "name" in vars && "level" in vars) return `${vars.name} · level ${vars.level}`;
      if (vars && "xp" in vars && "nextLevel" in vars) {
        return `${vars.xp} xp / to ${vars.nextLevel} — ${vars.remaining}`;
      }
      if (vars && "xp" in vars) return `${vars.xp} xp — max level`;
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

function mockApi(pet: PetDto, earned: EarnedAchievement[] = []) {
  vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
    if (path === "/pet") return createSuccessResponse(pet);
    if (path === "/marks") {
      return createSuccessResponse({ date: "2026-04-07", total: 2, taken: 1, items: [] });
    }
    if (path === "/achievements") return createSuccessResponse({ earned });
    throw new Error(`unexpected path ${path}`);
  });
}

describe("PetScene", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sprout stage and level line for a fresh pet", async () => {
    mockApi({ xp: 50, level: 1, next_level_xp: 100 });

    render(<PetScene />, { wrapper: createWrapper() });

    expect(await screen.findByText("🌱")).toBeInTheDocument();
    expect(screen.getByText("pet.plant_name · level 1")).toBeInTheDocument();
  });

  it("renders the tree stage at max level with no ceiling", async () => {
    mockApi({ xp: 12000, level: 8, next_level_xp: null });

    render(<PetScene />, { wrapper: createWrapper() });

    expect(await screen.findByText("🌳")).toBeInTheDocument();
    expect(screen.getByText("12000 xp — max level")).toBeInTheDocument();
  });

  it("fills the xp bar proportionally within the current level band", async () => {
    mockApi({ xp: 200, level: 2, next_level_xp: 300 });

    render(<PetScene />, { wrapper: createWrapper() });

    const bar = await screen.findByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });

  it("renders earned cosmetic slots in color and locked slots grayscale with a lock icon", async () => {
    mockApi({ xp: 50, level: 1, next_level_xp: 100 }, [
      { achievement_id: "iron_will_30", earned_at: "2026-04-01T00:00:00Z" },
    ]);

    render(<PetScene />, { wrapper: createWrapper() });

    await screen.findByText("🌱");
    expect(screen.getByText("🎩")).toBeInTheDocument();
    const lockedSlots = screen.getAllByText("🔒");
    expect(lockedSlots).toHaveLength(3);
  });

  it("unlocks the crown slot for any _100 ladder badge", async () => {
    mockApi({ xp: 50, level: 1, next_level_xp: 100 }, [
      { achievement_id: "coffee_100", earned_at: "2026-04-01T00:00:00Z" },
    ]);

    render(<PetScene />, { wrapper: createWrapper() });

    await screen.findByText("🌱");
    expect(screen.getByText("👑")).toBeInTheDocument();
  });
});
