import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { TodayFeed } from "../TodayFeed";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";
import type { MarksResponse } from "@/entities/mark";

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

const streakyHabit = { ...mockEntries[2], id: 3, streak_current: 5 };

function mockEntriesResponse(entries = [mockEntries[0], streakyHabit]) {
  vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
    if (path === "/entries") {
      const dtos = await Promise.all(entries.map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    }
    throw new Error(`unexpected path ${path}`);
  });
}

function marksFor(status1: boolean, status2: boolean, date = "2026-04-07"): MarksResponse {
  return {
    date,
    total: 2,
    taken: [status1, status2].filter(Boolean).length,
    items: [
      {
        id: 10,
        entry_id: 1,
        entry_kind: "med",
        entry_time: "08:00",
        schedule: "morning",
        date,
        status: status1,
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
        date,
        status: status2,
        updated_at: null,
        entry_frequency: "daily",
        entry_interval_days: null,
        entry_color: null,
      },
    ],
  };
}

describe("TodayFeed", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a streak pill for an entry with a positive streak", async () => {
    mockEntriesResponse();
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/marks") return createSuccessResponse(marksFor(false, false));
      const dtos = await Promise.all([mockEntries[0], streakyHabit].map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<TodayFeed />, { wrapper: createWrapper() });

    const pill = await screen.findByLabelText("streak");
    expect(pill).toHaveTextContent("5");
  });

  it("navigates to the game page when a streak pill is tapped", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/marks") return createSuccessResponse(marksFor(false, false));
      const dtos = await Promise.all([mockEntries[0], streakyHabit].map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<TodayFeed />, { wrapper: createWrapper() });

    const pill = await screen.findByLabelText("streak");
    fireEvent.click(pill);

    expect(mockNavigate).toHaveBeenCalledWith("/game");
  });

  it("shows confetti and sets a localStorage flag the first time the day hits 100%", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/marks") return createSuccessResponse(marksFor(true, true));
      const dtos = await Promise.all([mockEntries[0], streakyHabit].map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<TodayFeed />, { wrapper: createWrapper() });

    expect(await screen.findByTestId("confetti")).toBeInTheDocument();
    expect(localStorage.getItem("rhythm_confetti_shown_2026-04-07")).toBe("1");
  });

  it("does not show confetti again once the day's flag is already set", async () => {
    localStorage.setItem("rhythm_confetti_shown_2026-04-07", "1");
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/marks") return createSuccessResponse(marksFor(true, true));
      const dtos = await Promise.all([mockEntries[0], streakyHabit].map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<TodayFeed />, { wrapper: createWrapper() });

    await screen.findByText("2 of 2 taken");
    expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
  });

  it("does not show confetti when the day is not fully taken", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/marks") return createSuccessResponse(marksFor(true, false));
      const dtos = await Promise.all([mockEntries[0], streakyHabit].map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<TodayFeed />, { wrapper: createWrapper() });

    await screen.findByText("1 of 2 taken");
    expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
    expect(localStorage.getItem("rhythm_confetti_shown_2026-04-07")).toBeNull();
  });

  it("never renders a note entry, even if one is present in the entries cache", async () => {
    const noteEntry = { ...mockEntries[0], id: 99, kind: "note" as const, name: "Grocery list" };
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/marks") return createSuccessResponse(marksFor(false, false));
      const dtos = await Promise.all(
        [mockEntries[0], streakyHabit, noteEntry].map((e) => buildEntryDto(e))
      );
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<TodayFeed />, { wrapper: createWrapper() });

    await screen.findByText("0 of 2 taken");
    expect(screen.queryByText("Grocery list")).not.toBeInTheDocument();
  });
});
