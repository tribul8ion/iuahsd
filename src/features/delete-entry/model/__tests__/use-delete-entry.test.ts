import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useDeleteEntry } from "../use-delete-entry";
import { apiClient } from "@/shared/api";
import { entryKeys } from "@/entities/entry";
import { markKeys } from "@/entities/mark";
import { projectKeys } from "@/entities/project";
import type { Entry } from "@/entities/entry";
import {
  createSuccessResponse,
  createErrorResponse,
  mockEntries,
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

function createTestEnv(initialEntries?: Entry[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  if (initialEntries) {
    queryClient.setQueryData(entryKeys.list(), initialEntries);
  }

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

describe("useDeleteEntry", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls DELETE to /entries/:id", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.delete).toHaveBeenCalledWith("/entries/1");
  });

  it("optimistically removes entry from cached list", async () => {
    let resolveDelete: (value: unknown) => void;
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });
    vi.mocked(apiClient.delete).mockReturnValue(deletePromise as ReturnType<typeof apiClient.delete>);

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Entry[]>(entryKeys.list());
      expect(cached).toHaveLength(mockEntries.length - 1);
      expect(cached?.find((e) => e.id === 1)).toBeUndefined();
    });

    resolveDelete!(createSuccessResponse(null));
  });

  it("reverts optimistic update on error", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createErrorResponse("Cannot delete")
    );

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    await waitFor(() => {
      const cached = queryClient.getQueryData<Entry[]>(entryKeys.list());
      expect(cached).toHaveLength(mockEntries.length);
      expect(cached?.find((e) => e.id === 1)).toBeDefined();
    });
  });

  it("invalidates entries list on settle", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: entryKeys.list() })
    );
  });

  it("invalidates all marks on settle", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: markKeys.all })
    );
  });

  it("invalidates the projects list when the deleted entry is a task", async () => {
    const taskEntry: Entry = { ...mockEntries[0], id: 9, kind: "task" };
    vi.mocked(apiClient.delete).mockResolvedValue(createSuccessResponse(null));

    const { queryClient, wrapper } = createTestEnv([...mockEntries, taskEntry]);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(9);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectKeys.list() })
    );
  });

  it("does not invalidate the projects list when the deleted entry is not a task", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(createSuccessResponse(null));

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectKeys.list() })
    );
  });

  it("returns the deleted entry id", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(2);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe(2);
  });

  it("throws when delete response is not successful", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(
      createErrorResponse("Forbidden")
    );

    const { wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useDeleteEntry(), { wrapper });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Forbidden");
  });
});
