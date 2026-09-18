import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { TodayPage } from "../TodayPage";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";
import type { MarksResponse } from "@/entities/mark";
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

vi.mock("@/shared/lib", () => ({
  hapticFeedback: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && typeof vars === "object" && "returnObjects" in vars) {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      }
      if (vars && "taken" in vars && "total" in vars) {
        return `${vars.taken} of ${vars.total} taken`;
      }
      if (vars && "n" in vars) return `every ${vars.n} days`;
      return key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const habitEntry = { ...mockEntries[2], id: 3, frequency_type: "daily" as const };

const marksResponse: MarksResponse = {
  date: "2026-04-07",
  total: 3,
  taken: 1,
  items: [
    {
      id: 10,
      entry_id: 1,
      entry_kind: "med",
      entry_time: "08:00",
      schedule: "morning",
      date: "2026-04-07",
      status: true,
      updated_at: "2026-04-07T08:05:00Z",
      entry_frequency: "daily",
      entry_interval_days: null,
      entry_color: null,
    },
    {
      id: 11,
      entry_id: 2,
      entry_kind: "med",
      entry_time: "20:00",
      schedule: "evening",
      date: "2026-04-07",
      status: false,
      updated_at: null,
      entry_frequency: "daily",
      entry_interval_days: null,
      entry_color: null,
    },
    {
      id: 12,
      entry_id: 3,
      entry_kind: "habit",
      entry_time: "08:00",
      schedule: "custom",
      date: "2026-04-07",
      status: false,
      updated_at: null,
      entry_frequency: "daily",
      entry_interval_days: null,
      entry_color: null,
    },
  ],
};

const petResponse: PetDto = { xp: 50, level: 1, next_level_xp: 100 };

describe("TodayPage", () => {
  beforeEach(async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });

    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/marks") {
        return createSuccessResponse(marksResponse);
      }
      if (path === "/entries") {
        const entries = await Promise.all(
          [mockEntries[0], mockEntries[1], habitEntry].map((e) => buildEntryDto(e))
        );
        return createSuccessResponse({ entries, count: entries.length });
      }
      if (path === "/pet") {
        return createSuccessResponse(petResponse);
      }
      throw new Error(`unexpected path ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title and progress ring", async () => {
    render(<TodayPage />, { wrapper: createWrapper() });
    expect(await screen.findByText("today.title")).toBeInTheDocument();
    expect(await screen.findByText("1 of 3 taken")).toBeInTheDocument();
  });

  it("groups marks under their shared entry_time, mixing meds and habits", async () => {
    render(<TodayPage />, { wrapper: createWrapper() });

    expect(await screen.findByText("Aspirin")).toBeInTheDocument();
    expect(screen.getByText("Meditation")).toBeInTheDocument();
    expect(screen.getByText("Vitamin D")).toBeInTheDocument();

    const timeHeaders = screen.getAllByText("08:00");
    expect(timeHeaders.length).toBeGreaterThan(0);
    expect(screen.getByText("20:00")).toBeInTheDocument();
  });

  it("renders a mark-taken control for every item", async () => {
    render(<TodayPage />, { wrapper: createWrapper() });
    await screen.findByText("Aspirin");
    expect(screen.getAllByRole("button", { name: /mark_taken|undo_taken/ })).toHaveLength(3);
  });

  it("navigates to the game page when the pet chip is tapped", async () => {
    render(<TodayPage />, { wrapper: createWrapper() });

    const chip = await screen.findByLabelText("pet-chip");
    fireEvent.click(chip);

    expect(mockNavigate).toHaveBeenCalledWith("/game");
  });
});
