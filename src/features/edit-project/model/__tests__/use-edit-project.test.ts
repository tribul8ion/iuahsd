import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useEditProject } from "../use-edit-project";
import { apiClient } from "@/shared/api";
import { decryptProjectPayload, encryptProjectPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { projectKeys } from "@/entities/project";
import type { Project, ProjectDto } from "@/entities/project";

const TEST_KEY: Uint8Array = new Uint8Array(32).fill(6);

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

function createTestEnv(initial?: Project[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  if (initial) {
    queryClient.setQueryData(projectKeys.list(), initial);
  }
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

async function updatedDto(name: string): Promise<ProjectDto> {
  return {
    id: 7,
    payload_encrypted: await encryptProjectPayload({ v: 1, name }, TEST_KEY),
    total_tasks: 2,
    done_tasks: 1,
    created_at: "2026-03-05T00:00:00Z",
  };
}

describe("useEditProject", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_KEY, bootState: "ready" });
  });

  afterEach(() => vi.clearAllMocks());

  it("puts an encrypted new name to /projects/{id}", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: await updatedDto("Renamed"),
      error: null,
    });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useEditProject(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 7, name: "Renamed" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [path, body] = vi.mocked(apiClient.put).mock.calls[0] as [
      string,
      { payload_encrypted: string },
    ];
    expect(path).toBe("/projects/7");
    const decrypted = await decryptProjectPayload(body.payload_encrypted, TEST_KEY);
    expect(decrypted).toEqual({ v: 1, name: "Renamed" });
  });

  it("replaces the project in the cached list on success", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: true,
      data: await updatedDto("Renamed"),
      error: null,
    });

    const existing: Project = {
      id: 7,
      name: "Old name",
      total: 2,
      done: 1,
      created_at: "2026-03-05T00:00:00Z",
      corrupted: false,
    };
    const { queryClient, wrapper } = createTestEnv([existing]);
    const { result } = renderHook(() => useEditProject(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 7, name: "Renamed" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Project[]>(projectKeys.list());
    expect(cached?.[0].name).toBe("Renamed");
  });

  it("fails without a crypto key", async () => {
    useSessionStore.setState({ cryptoKey: null, bootState: "unlock" });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useEditProject(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 7, name: "Renamed" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("crypto_key_missing");
    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it("throws when the response is not successful", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      success: false,
      data: null,
      error: "project_not_found",
    });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useEditProject(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 7, name: "Renamed" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("project_not_found");
  });
});
