import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AgendaList } from "../AgendaList";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";
import type { MarksResponse } from "@/entities/mark";
import type { Entry } from "@/entities/entry";
import { isoDate, todayISO } from "../../model/grid";

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>(
    "@/shared/lib"
  );
  return { ...actual, hapticFeedback: vi.fn() };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && typeof vars === "object" && "returnObjects" in vars) {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      }
      if (vars && "taken" in vars && "total" in vars) {
        return `${vars.taken} of ${vars.total}`;
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

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDate(new Date(y, m - 1, d + delta));
}

const TODAY = todayISO();
const PAST = addDays(TODAY, -10);
const FUTURE = addDays(TODAY, 10);

const docEntry: Entry = {
  ...mockEntries[0],
  id: 5,
  kind: "doc",
  name: "Dentist",
  date_once: TODAY,
  time: "10:00",
  pre_remind: [1440, 180],
};

function marksFor(date: string): MarksResponse {
  return {
    date,
    total: 2,
    taken: 1,
    items: [
      {
        id: 10,
        entry_id: 1,
        entry_kind: "med",
        entry_time: "08:00",
        schedule: "morning",
        date,
        status: true,
        updated_at: null,
        entry_frequency: "daily",
        entry_interval_days: null,
        entry_color: null,
      },
      {
        id: 11,
        entry_id: 5,
        entry_kind: "doc",
        entry_time: "10:00",
        schedule: "custom",
        date,
        status: false,
        updated_at: null,
        entry_frequency: "once",
        entry_interval_days: null,
        entry_color: null,
      },
    ],
  };
}

function mockEntriesAndMarks(date: string) {
  vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
    if (path.startsWith("/marks")) return createSuccessResponse(marksFor(date));
    const dtos = await Promise.all([mockEntries[0], docEntry].map((e) => buildEntryDto(e)));
    return createSuccessResponse({ entries: dtos, count: dtos.length });
  });
}

describe("AgendaList", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the full list of marks with a progress count, not a summary", async () => {
    mockEntriesAndMarks(TODAY);
    render(<AgendaList date={TODAY} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    expect(await screen.findByText("Aspirin")).toBeInTheDocument();
    expect(screen.getByText("Dentist")).toBeInTheDocument();
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("shows a pre-remind summary chip for a doc row", async () => {
    mockEntriesAndMarks(TODAY);
    render(<AgendaList date={TODAY} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    await screen.findByText("Dentist");
    expect(
      screen.getByText("once.pre_phrase_1440 calendar.and once.pre_phrase_180")
    ).toBeInTheDocument();
  });

  it("keeps the mark circle interactive for today and calls the API on click", async () => {
    mockEntriesAndMarks(TODAY);
    vi.mocked(apiClient.patch).mockResolvedValue(createSuccessResponse(null));
    render(<AgendaList date={TODAY} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    await screen.findByText("Dentist");
    fireEvent.click(screen.getByLabelText("checklist.mark_taken"));

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith("/marks/11", { status: true })
    );
  });

  it("disables the mark circle for a future date", async () => {
    mockEntriesAndMarks(FUTURE);
    render(<AgendaList date={FUTURE} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    await screen.findByText("Dentist");
    expect(screen.getAllByLabelText("future-mark")).toHaveLength(2);
    expect(screen.queryByLabelText("checklist.mark_taken")).not.toBeInTheDocument();
  });

  it("shows the retro hint for a past date", async () => {
    mockEntriesAndMarks(PAST);
    render(<AgendaList date={PAST} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    await screen.findByText("Dentist");
    expect(screen.getByText("calendar.retro_hint")).toBeInTheDocument();
  });

  it("does not show the retro hint for today or the future", async () => {
    mockEntriesAndMarks(TODAY);
    render(<AgendaList date={TODAY} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    await screen.findByText("Dentist");
    expect(screen.queryByText("calendar.retro_hint")).not.toBeInTheDocument();
  });

  it("opens the edit modal for a doc row but not a med row", async () => {
    mockEntriesAndMarks(TODAY);
    const onEditOnce = vi.fn();
    render(<AgendaList date={TODAY} onEditOnce={onEditOnce} />, { wrapper: createWrapper() });

    await screen.findByText("Dentist");
    fireEvent.click(screen.getByText("Aspirin"));
    expect(onEditOnce).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Dentist"));
    expect(onEditOnce).toHaveBeenCalledWith(expect.objectContaining({ id: 5, kind: "doc" }));
  });

  it("never renders a note entry, even if one is present in the entries cache", async () => {
    const noteEntry = { ...mockEntries[0], id: 98, kind: "note" as const, name: "Grocery list" };
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path.startsWith("/marks")) return createSuccessResponse(marksFor(TODAY));
      const dtos = await Promise.all(
        [mockEntries[0], docEntry, noteEntry].map((e) => buildEntryDto(e))
      );
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<AgendaList date={TODAY} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    await screen.findByText("Dentist");
    expect(screen.queryByText("Grocery list")).not.toBeInTheDocument();
  });

  it("shows a color indicator next to a med row only when the mark has a color", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path.startsWith("/marks")) {
        const marks = marksFor(TODAY);
        marks.items[0]!.entry_color = "blue";
        return createSuccessResponse(marks);
      }
      const dtos = await Promise.all([mockEntries[0], docEntry].map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    });

    render(<AgendaList date={TODAY} onEditOnce={vi.fn()} />, { wrapper: createWrapper() });

    await screen.findByText("Aspirin");
    expect(screen.getByLabelText("mark-medication-color")).toBeInTheDocument();
  });
});
