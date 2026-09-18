import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AddEntrySheet } from "../AddEntrySheet";
import { useSessionStore } from "@/shared/session";
import { TEST_CRYPTO_KEY } from "@/test/mocks/handlers";

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
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("AddEntrySheet", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  it("shows five choice rows: medication, habit, task, doctor visit and note", () => {
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByText("add_sheet.med")).toBeInTheDocument();
    expect(screen.getByText("add_sheet.habit")).toBeInTheDocument();
    expect(screen.getByText("add_sheet.task")).toBeInTheDocument();
    expect(screen.getByText("add_sheet.doc")).toBeInTheDocument();
    expect(screen.getByText("add_sheet.note")).toBeInTheDocument();
  });

  it("opens the task form when the task row is clicked", () => {
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("add_sheet.task"));
    expect(screen.getByRole("heading", { name: "once.add_task" })).toBeInTheDocument();
  });

  it("opens the doc form when the doc row is clicked", () => {
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("add_sheet.doc"));
    expect(screen.getByRole("heading", { name: "once.add_doc" })).toBeInTheDocument();
  });

  it("opens the note modal when the note row is clicked", () => {
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("add_sheet.note"));
    expect(screen.getByRole("heading", { name: "note.add_title" })).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(<AddEntrySheet isOpen={false} onClose={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.queryByText("add_sheet.title")).not.toBeInTheDocument();
  });
});
