import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { CalendarPage } from "../CalendarPage";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import { createSuccessResponse, TEST_CRYPTO_KEY } from "@/test/mocks/handlers";
import type { MarksRangeResponse, MarksResponse } from "@/entities/mark";
import { todayISO } from "../../model/grid";

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
      if (vars && "count" in vars && "month" in vars) {
        return `${vars.count} marks in ${vars.month}`;
      }
      return key;
    },
    i18n: { language: "en" },
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

const TODAY = todayISO();

const rangeResponse: MarksRangeResponse = {
  items: [
    { date: TODAY, entry_kind: "med", status: true, entry_color: null },
    { date: TODAY, entry_kind: "habit", status: null, entry_color: null },
  ],
};

const emptyMarks: MarksResponse = { date: TODAY, total: 0, taken: 0, items: [] };

describe("CalendarPage", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path.startsWith("/marks/range")) return createSuccessResponse(rangeResponse);
      if (path.startsWith("/marks")) return createSuccessResponse(emptyMarks);
      return createSuccessResponse({ entries: [], count: 0 });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the header title and the month's mark count", async () => {
    render(<CalendarPage />, { wrapper: createWrapper() });
    expect(screen.getByText("calendar.title")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/2 marks in/)).toBeInTheDocument());
  });

  it("renders the month grid and the agenda section", async () => {
    render(<CalendarPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByLabelText(TODAY)).toBeInTheDocument());
    expect(screen.getByText("calendar.empty_day")).toBeInTheDocument();
  });

  it("clamps month navigation to a 12-month window and disables the buttons at the edge", async () => {
    render(<CalendarPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByLabelText(TODAY)).toBeInTheDocument());

    expect(screen.getByLabelText("calendar.prev_month")).not.toBeDisabled();
    expect(screen.getByLabelText("calendar.next_month")).not.toBeDisabled();

    // MonthCard unmounts behind a Spinner while each newly-visited month's
    // range data loads, so the button must be re-queried after every click.
    for (let i = 0; i < 12; i += 1) {
      fireEvent.click(screen.getByLabelText("calendar.next_month"));
      await waitFor(() =>
        expect(screen.getByLabelText("calendar.next_month")).toBeInTheDocument()
      );
    }
    expect(screen.getByLabelText("calendar.next_month")).toBeDisabled();

    fireEvent.click(screen.getByLabelText("calendar.next_month"));
    expect(screen.getByLabelText("calendar.next_month")).toBeDisabled();

    for (let i = 0; i < 24; i += 1) {
      fireEvent.click(screen.getByLabelText("calendar.prev_month"));
      await waitFor(() =>
        expect(screen.getByLabelText("calendar.prev_month")).toBeInTheDocument()
      );
    }
    expect(screen.getByLabelText("calendar.prev_month")).toBeDisabled();
  }, 20000);
});
