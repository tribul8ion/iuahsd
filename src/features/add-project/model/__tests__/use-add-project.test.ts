import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAddProject } from "../use-add-project";
import { apiClient } from "@/shared/api";
import { decryptProjectPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { projectKeys } from "@/entities/project";
import type { Project, ProjectDto } from "@/entities/project";

const TEST_KEY: Uint8Array = new Uint8Array(32).fill(5);

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

const createdDto: ProjectDto = {
  id: 9,
  payload_encrypted: "placeholder",
  total_tasks: 0,
  done_tasks: 0,
  created_at: "2026-03-01T00:00:00Z",
};

describe("useAddProject", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_KEY, bootState: "ready" });
  });

  afterEach(() => vi.clearAllMocks());

  it("posts an encrypted project name to /projects", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: createdDto,
      error: null,
    });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddProject(), { wrapper });

    await act(async () => {
      result.current.mutate("Kitchen renovation");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [path, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      { payload_encrypted: string },
    ];
    expect(path).toBe("/projects");
    const decrypted = await decryptProjectPayload(body.payload_encrypted, TEST_KEY);
    expect(decrypted).toEqual({ v: 1, name: "Kitchen renovation" });
  });

  it("appends the new project to the cached list", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: true,
      data: createdDto,
      error: null,
    });

    const { queryClient, wrapper } = createTestEnv([]);
    const { result } = renderHook(() => useAddProject(), { wrapper });

    await act(async () => {
      result.current.mutate("Kitchen renovation");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Project[]>(projectKeys.list());
    expect(cached).toHaveLength(1);
    expect(cached?.[0].id).toBe(9);
  });

  it("fails without a crypto key", async () => {
    useSessionStore.setState({ cryptoKey: null, bootState: "unlock" });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddProject(), { wrapper });

    await act(async () => {
      result.current.mutate("Kitchen renovation");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("crypto_key_missing");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("throws when the response is not successful", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      success: false,
      data: null,
      error: "too_many_projects",
    });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddProject(), { wrapper });

    await act(async () => {
      result.current.mutate("Kitchen renovation");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("too_many_projects");
  });
});
