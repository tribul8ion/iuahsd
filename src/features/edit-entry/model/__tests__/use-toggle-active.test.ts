import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useToggleEntryActive } from "../use-toggle-active";
import { apiClient } from "@/shared/api";
import { entryKeys } from "@/entities/entry";
import { markKeys } from "@/entities/mark";
import type { Entry } from "@/entities/entry";
import {
  createSuccessResponse,
  createErrorResponse,
  buildEntryDto,
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

describe("useToggleEntryActive", () => {
  afterEach(() => vi.clearAllMocks());

  it("sends PUT with only the active flag", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(
        await buildEntryDto({ ...mockEntries[0], active: false })
      )
    );

    const { wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useToggleEntryActive(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 1, active: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.put).toHaveBeenCalledWith("/entries/1", {
      active: false,
    });
  });

  it("updates the cached entry active flag without re-decrypting", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(
        await buildEntryDto({ ...mockEntries[0], active: false })
      )
    );

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useToggleEntryActive(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 1, active: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Entry[]>(entryKeys.list());
    expect(cached?.[0].active).toBe(false);
    expect(cached?.[0].name).toBe("Aspirin");
    expect(cached?.[1].active).toBe(true);
  });

  it("invalidates all marks (today/byDate/range) on success", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(
        await buildEntryDto({ ...mockEntries[0], active: false })
      )
    );

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useToggleEntryActive(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 1, active: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: markKeys.all })
    );
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(createErrorResponse("Not found"));

    const { wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useToggleEntryActive(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 1, active: false });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Not found");
  });
});
