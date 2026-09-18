import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useDeleteProject } from "../use-delete-project";
import { apiClient } from "@/shared/api";
import { projectKeys } from "@/entities/project";
import { entryKeys } from "@/entities/entry";
import type { Project } from "@/entities/project";

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

const projects: Project[] = [
  { id: 1, name: "Move", total: 3, done: 1, created_at: null, corrupted: false },
  { id: 2, name: "Renovate", total: 0, done: 0, created_at: null, corrupted: false },
];

function createTestEnv() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  queryClient.setQueryData(projectKeys.list(), projects);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

describe("useDeleteProject", () => {
  afterEach(() => vi.clearAllMocks());

  it("optimistically removes the project from the cached list", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ success: true, data: null, error: null });

    const { queryClient, wrapper } = createTestEnv();
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() =>
      expect(queryClient.getQueryData<Project[]>(projectKeys.list())).toHaveLength(1)
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith("/projects/1");
  });

  it("invalidates the entries list so orphaned tasks refresh", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ success: true, data: null, error: null });

    const { queryClient, wrapper } = createTestEnv();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: entryKeys.list() })
    );
  });

  it("restores the cache when the delete request fails", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({
      success: false,
      data: null,
      error: "Server error",
    });

    const { queryClient, wrapper } = createTestEnv();
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData<Project[]>(projectKeys.list())).toHaveLength(2);
  });
});
