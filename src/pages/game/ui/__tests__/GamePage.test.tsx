import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { GamePage } from "../GamePage";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";
import type { PetDto } from "@/entities/pet";

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
      if (vars && "count" in vars && "total" in vars) return `${vars.count}/${vars.total}`;
      if (vars && "name" in vars && "level" in vars) return `${vars.name} · level ${vars.level}`;
      if (vars && "xp" in vars && "nextLevel" in vars) {
        return `${vars.xp} xp / to ${vars.nextLevel} — ${vars.remaining}`;
      }
      if (vars && "xp" in vars) return `${vars.xp} xp — max level`;
      return key;
    },
  }),
}));

const petResponse: PetDto = { xp: 50, level: 1, next_level_xp: 100 };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("GamePage", () => {
  beforeEach(async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });

    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/pet") return createSuccessResponse(petResponse);
      if (path === "/marks") {
        return createSuccessResponse({ date: "2026-04-07", total: 0, taken: 0, items: [] });
      }
      if (path === "/achievements") return createSuccessResponse({ earned: [] });
      if (path === "/entries") {
        const dtos = await Promise.all([mockEntries[0]].map((e) => buildEntryDto(e)));
        return createSuccessResponse({ entries: dtos, count: dtos.length });
      }
      throw new Error(`unexpected path ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the pet scene by default", async () => {
    render(<GamePage />, { wrapper: createWrapper() });
    expect(await screen.findByText("pet.about_title")).toBeInTheDocument();
    expect(screen.queryByText("achievements.progress")).not.toBeInTheDocument();
  });

  it("switches to the shelf segment when tapped", async () => {
    render(<GamePage />, { wrapper: createWrapper() });
    await screen.findByText("pet.about_title");

    fireEvent.click(screen.getByText("game.segment_shelf"));

    expect(await screen.findByText("0/42")).toBeInTheDocument();
    expect(screen.queryByText("pet.about_title")).not.toBeInTheDocument();
  });

  it("marks the active segment tab", async () => {
    render(<GamePage />, { wrapper: createWrapper() });
    await screen.findByText("pet.about_title");

    const petTab = screen.getByText("game.segment_pet");
    const shelfTab = screen.getByText("game.segment_shelf");
    expect(petTab).toHaveAttribute("aria-selected", "true");
    expect(shelfTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(shelfTab);
    expect(shelfTab).toHaveAttribute("aria-selected", "true");
    expect(petTab).toHaveAttribute("aria-selected", "false");
  });
});
