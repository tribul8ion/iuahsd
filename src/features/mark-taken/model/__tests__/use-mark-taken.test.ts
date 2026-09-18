import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useMarkTaken } from "../use-mark-taken";
import { useAchievementQueueStore } from "../achievement-queue";
import { apiClient } from "@/shared/api";
import { markKeys } from "@/entities/mark";
import type { MarksResponse } from "@/entities/mark";
import { entryKeys } from "@/entities/entry";
import { projectKeys } from "@/entities/project";
import { achievementKeys } from "@/entities/achievement";
import { petKeys } from "@/entities/pet";
import type { PetDto } from "@/entities/pet";
import {
  createSuccessResponse,
  createErrorResponse,
  mockMarkItems,
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

const mockMarksResponse: MarksResponse = {
  items: mockMarkItems,
  date: "2026-04-07",
  total: 2,
  taken: 1,
};

function createTestEnv(initialMarks?: MarksResponse) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  if (initialMarks) {
    queryClient.setQueryData(markKeys.today(), initialMarks);
  }

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

describe("useMarkTaken", () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAchievementQueueStore.setState({ queue: [] });
  });

  it("calls PATCH to /marks/:id with status", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { wrapper } = createTestEnv(mockMarksResponse);
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.patch).toHaveBeenCalledWith("/marks/10", { status: true });
  });

  it("optimistically updates mark status to true", async () => {
    let resolvePatch: (value: unknown) => void;
    const patchPromise = new Promise((resolve) => {
      resolvePatch = resolve;
    });
    vi.mocked(apiClient.patch).mockReturnValue(patchPromise as ReturnType<typeof apiClient.patch>);

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MarksResponse>(markKeys.today());
      expect(cached?.items.find((e) => e.id === 10)?.status).toBe(true);
    });

    resolvePatch!(createSuccessResponse(null));
  });

  it("reverts optimistic update on error", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createErrorResponse("Server error")
    );

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    await waitFor(() => {
      const cached = queryClient.getQueryData<MarksResponse>(markKeys.today());
      expect(cached?.items.find((e) => e.id === 10)?.status).toBe(false);
    });
  });

  it("invalidates today marks on settle", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: markKeys.today() })
    );
  });

  it("preserves other entries during optimistic update", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MarksResponse>(markKeys.today());
      const untouched = cached?.items.find((e) => e.id === 11);
      expect(untouched?.status).toBe(true);
      expect(untouched?.entry_id).toBe(2);
    });
  });

  it("invalidates entries and achievements on settle, since streaks may have changed", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse({ status: true, newly_awarded: [] })
    );

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: entryKeys.list() })
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: achievementKeys.list() })
    );
  });

  it("invalidates the projects list on settle, since a task mark may affect project counts", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectKeys.list() })
    );
  });

  it("enqueues newly awarded achievements from the PATCH response", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse({ status: true, newly_awarded: ["first_step", "combo_5"] })
    );

    const { wrapper } = createTestEnv(mockMarksResponse);
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useAchievementQueueStore.getState().queue).toEqual(["first_step", "combo_5"]);
  });

  it("updates the pet cache from the PATCH response's pet field", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse({ status: true, newly_awarded: [], pet: { xp: 110, level: 2 } })
    );

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const pet = queryClient.getQueryData<PetDto>(petKeys.detail());
    expect(pet).toEqual({ xp: 110, level: 2, next_level_xp: 300 });
  });

  it("leaves the pet cache untouched when the response has no pet field", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(createSuccessResponse(null));

    const { queryClient, wrapper } = createTestEnv(mockMarksResponse);
    queryClient.setQueryData(petKeys.detail(), { xp: 5, level: 1, next_level_xp: 100 });
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData<PetDto>(petKeys.detail())).toEqual({
      xp: 5,
      level: 1,
      next_level_xp: 100,
    });
  });

  it("does not enqueue anything when newly_awarded is empty or missing", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse(null)
    );

    const { wrapper } = createTestEnv(mockMarksResponse);
    const { result } = renderHook(() => useMarkTaken(), { wrapper });

    await act(async () => {
      result.current.mutate({ markId: 10, status: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useAchievementQueueStore.getState().queue).toEqual([]);
  });
});
