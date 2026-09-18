import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { HabitsPage } from "../HabitsPage";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";

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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && typeof vars === "object" && "returnObjects" in vars) {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      }
      if (vars && "count" in vars) return `${vars.count} active`;
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

function mockEntriesResponse() {
  vi.mocked(apiClient.get).mockImplementation(async () => {
    const entries = await Promise.all(mockEntries.map((e) => buildEntryDto(e)));
    return createSuccessResponse({ entries, count: entries.length });
  });
}

describe("HabitsPage", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders only habit entries, excluding medications", async () => {
    mockEntriesResponse();
    render(<HabitsPage />, { wrapper: createWrapper() });

    expect(await screen.findByText("Meditation")).toBeInTheDocument();
    expect(screen.queryByText("Aspirin")).not.toBeInTheDocument();
    expect(screen.queryByText("Vitamin D")).not.toBeInTheDocument();
  });

  it("shows the active habit count in the header", async () => {
    mockEntriesResponse();
    render(<HabitsPage />, { wrapper: createWrapper() });
    expect(await screen.findByText("1 active")).toBeInTheDocument();
  });

  it("toggles a habit's active flag via the switch", async () => {
    mockEntriesResponse();
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto({ ...mockEntries[2], active: false }))
    );

    render(<HabitsPage />, { wrapper: createWrapper() });
    await screen.findByText("Meditation");

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(apiClient.put).toHaveBeenCalledWith("/entries/3", { active: false })
    );
  });

  it("opens the edit modal when a habit card is clicked", async () => {
    mockEntriesResponse();
    render(<HabitsPage />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByText("Meditation"));
    expect(screen.getByText("habit.edit_habit")).toBeInTheDocument();
  });

  it("shows an empty state with no habits", async () => {
    vi.mocked(apiClient.get).mockImplementation(async () => {
      const medOnly = mockEntries.filter((e) => e.kind === "med");
      const entries = await Promise.all(medOnly.map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries, count: entries.length });
    });

    render(<HabitsPage />, { wrapper: createWrapper() });
    expect(await screen.findByText("habits.empty_title")).toBeInTheDocument();
  });
});
