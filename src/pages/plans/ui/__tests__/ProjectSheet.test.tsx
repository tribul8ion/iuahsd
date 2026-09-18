import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { ProjectSheet } from "../ProjectSheet";
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
import type { Project, ProjectDto } from "@/entities/project";

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

const project: Project = {
  id: 1,
  name: "Kitchen renovation",
  total: 2,
  done: 1,
  created_at: null,
  corrupted: false,
};

const projectTask: Entry = {
  ...mockEntries[0],
  id: 40,
  kind: "task",
  name: "Buy tiles",
  project_id: 1,
  done: true,
};

const otherProjectTask: Entry = {
  ...mockEntries[0],
  id: 41,
  kind: "task",
  name: "Choose paint",
  project_id: 1,
  done: false,
};

const unrelatedTask: Entry = {
  ...mockEntries[0],
  id: 42,
  kind: "task",
  name: "Unrelated task",
  project_id: null,
  done: false,
};

async function mockData() {
  const projectDto: ProjectDto = {
    id: 1,
    payload_encrypted: await encryptProjectPayload({ v: 1, name: "Kitchen renovation" }, TEST_CRYPTO_KEY),
    total_tasks: 2,
    done_tasks: 1,
    created_at: null,
  };

  vi.mocked(apiClient.get).mockImplementation(async (endpoint: string) => {
    if (endpoint === "/projects") {
      return createSuccessResponse({ projects: [projectDto] });
    }
    const entries = await Promise.all(
      [projectTask, otherProjectTask, unrelatedTask].map((e) => buildEntryDto(e))
    );
    return createSuccessResponse({ entries, count: entries.length });
  });
}

describe("ProjectSheet", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => vi.clearAllMocks());

  it("shows only tasks belonging to this project", async () => {
    await mockData();
    render(<ProjectSheet project={project} isOpen onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText("Buy tiles")).toBeInTheDocument();
    expect(screen.getByText("Choose paint")).toBeInTheDocument();
    expect(screen.queryByText("Unrelated task")).not.toBeInTheDocument();
  });

  it("renders a completed task with strikethrough styling", async () => {
    await mockData();
    render(<ProjectSheet project={project} isOpen onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    const doneTask = await screen.findByText("Buy tiles");
    expect(doneTask.style.textDecoration).toBe("line-through");

    const pendingTask = screen.getByText("Choose paint");
    expect(pendingTask.style.textDecoration).toBe("none");
  });

  it("opens the add-task form with this project preselected", async () => {
    await mockData();
    render(<ProjectSheet project={project} isOpen onClose={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    await screen.findByText("Buy tiles");
    fireEvent.click(screen.getByText("project.add_task"));

    await waitFor(() =>
      expect(screen.getByLabelText("pick-project")).toHaveTextContent("Kitchen renovation")
    );
  });
});
