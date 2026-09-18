import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { EditOnceEntryModal } from "../EditOnceEntryModal";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import type { Entry } from "@/entities/entry";
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

vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>(
    "@/shared/lib"
  );
  return { ...actual, hapticFeedback: vi.fn() };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const taskEntry: Entry = {
  ...mockEntries[0],
  id: 4,
  kind: "task",
  name: "Submit report",
  date_once: "2026-04-10",
  time: "18:00",
  pre_remind: [],
};

const docEntry: Entry = {
  ...mockEntries[0],
  id: 5,
  kind: "doc",
  name: "Dentist",
  date_once: "2026-04-12",
  time: "10:00",
  pre_remind: [1440, 180],
};

describe("EditOnceEntryModal", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("seeds the task name and shows no pre-remind chips selected", () => {
    render(
      <EditOnceEntryModal entry={taskEntry} isOpen={true} onClose={vi.fn()} onDelete={vi.fn()} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByDisplayValue("Submit report")).toBeInTheDocument();
    expect(screen.getByLabelText("pre-remind-1440")).toHaveAttribute("aria-pressed", "false");
  });

  it("seeds the doc's default pre-remind chips as selected", () => {
    render(
      <EditOnceEntryModal entry={docEntry} isOpen={true} onClose={vi.fn()} onDelete={vi.fn()} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByDisplayValue("Dentist")).toBeInTheDocument();
    expect(screen.getByLabelText("pre-remind-1440")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("pre-remind-180")).toHaveAttribute("aria-pressed", "true");
  });

  it("submits an updated name via PUT", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto({ ...taskEntry, name: "Submit report v2" }))
    );
    const onClose = vi.fn();
    render(
      <EditOnceEntryModal entry={taskEntry} isOpen={true} onClose={onClose} onDelete={vi.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.change(screen.getByDisplayValue("Submit report"), {
      target: { value: "Submit report v2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /once.save_changes/i }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith("/entries/4", expect.any(Object)));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("calls onDelete when the delete button is pressed", () => {
    const onDelete = vi.fn();
    render(
      <EditOnceEntryModal entry={taskEntry} isOpen={true} onClose={vi.fn()} onDelete={onDelete} />,
      { wrapper: createWrapper() }
    );
    fireEvent.click(screen.getByText("once.delete_task"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("shows the doc delete label for a doc entry", () => {
    render(
      <EditOnceEntryModal entry={docEntry} isOpen={true} onClose={vi.fn()} onDelete={vi.fn()} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText("once.delete_doc")).toBeInTheDocument();
  });
});
