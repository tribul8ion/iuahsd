import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { PlansPage } from "../PlansPage";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import { encryptProjectPayload } from "@/shared/crypto";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";
import type { Entry } from "@/entities/entry";
import type { ProjectDto } from "@/entities/project";

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
      if (vars && "count" in vars) return `${key}:${vars.count}`;
      return key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
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

const noteEntry: Entry = {
  ...mockEntries[0],
  id: 20,
  kind: "note",
  name: "Grocery list",
  notes: "Buy milk and eggs",
};

const otherNoteEntry: Entry = {
  ...mockEntries[0],
  id: 21,
  kind: "note",
  name: "Trip notes",
  notes: "Pack sunscreen",
};

async function mockPlansResponses() {
  const projectDto: ProjectDto = {
    id: 1,
    payload_encrypted: await encryptProjectPayload({ v: 1, name: "Kitchen renovation" }, TEST_CRYPTO_KEY),
    total_tasks: 4,
    done_tasks: 2,
    created_at: "2026-01-01T00:00:00Z",
  };

  vi.mocked(apiClient.get).mockImplementation(async (endpoint: string) => {
    if (endpoint === "/projects") {
      return createSuccessResponse({ projects: [projectDto] });
    }
    const entries = await Promise.all(
      [...mockEntries, noteEntry, otherNoteEntry].map((e) => buildEntryDto(e))
    );
    return createSuccessResponse({ entries, count: entries.length });
  });
}

describe("PlansPage", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders decrypted project cards and note rows", async () => {
    await mockPlansResponses();
    render(<PlansPage />, { wrapper: createWrapper() });

    expect(await screen.findByText("Kitchen renovation")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.getByText("Grocery list")).toBeInTheDocument();
    expect(screen.getByText("Trip notes")).toBeInTheDocument();
  });

  it("filters both lists locally without issuing extra network requests", async () => {
    await mockPlansResponses();
    render(<PlansPage />, { wrapper: createWrapper() });

    await screen.findByText("Kitchen renovation");
    await screen.findByText("Grocery list");

    const callsBeforeSearch = vi.mocked(apiClient.get).mock.calls.length;

    fireEvent.change(screen.getByLabelText("plans-search"), {
      target: { value: "grocery" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Trip notes")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Grocery list")).toBeInTheDocument();
    expect(screen.queryByText("Kitchen renovation")).not.toBeInTheDocument();
    expect(vi.mocked(apiClient.get).mock.calls.length).toBe(callsBeforeSearch);
  });

  it("does not filter immediately before the debounce delay elapses", async () => {
    await mockPlansResponses();
    render(<PlansPage />, { wrapper: createWrapper() });

    await screen.findByText("Trip notes");

    fireEvent.change(screen.getByLabelText("plans-search"), {
      target: { value: "grocery" },
    });

    expect(screen.getByText("Trip notes")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Trip notes")).not.toBeInTheDocument();
    });
  });

  it("opens the project sheet showing its name when a project card is clicked", async () => {
    await mockPlansResponses();
    render(<PlansPage />, { wrapper: createWrapper() });

    fireEvent.click(await screen.findByText("Kitchen renovation"));

    expect(screen.getAllByText("Kitchen renovation").length).toBeGreaterThan(1);
  });
});
