import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { markKeys, useTodayMarks } from "../queries";
import { apiClient } from "@/shared/api";
import type { MarksResponse } from "../types";
import {
  createSuccessResponse,
  createErrorResponse,
  mockMarkItems,
} from "@/test/mocks/handlers";

const mockMarksResponse: MarksResponse = {
  items: mockMarkItems,
  date: "2026-04-07",
  total: 2,
  taken: 1,
};

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("markKeys", () => {
  it("generates base key", () => {
    expect(markKeys.all).toEqual(["marks"]);
  });

  it("generates today key extending base", () => {
    expect(markKeys.today()).toEqual(["marks", "today"]);
  });

  it("generates date key with specific date", () => {
    expect(markKeys.byDate("2026-04-07")).toEqual([
      "marks",
      "date",
      "2026-04-07",
    ]);
  });
});

describe("useTodayMarks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches marks from /marks endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse(mockMarksResponse)
    );

    const { result } = renderHook(() => useTodayMarks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/marks");
    expect(result.current.data).toEqual(mockMarksResponse);
  });

  it("returns all entries with their status", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse(mockMarksResponse)
    );

    const { result } = renderHook(() => useTodayMarks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items[0].status).toBe(false);
    expect(result.current.data?.items[1].status).toBe(true);
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createErrorResponse("Unauthorized")
    );

    const { result } = renderHook(() => useTodayMarks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Unauthorized");
  });

  it("throws fallback message when error is null", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      data: null,
      error: null,
    });

    const { result } = renderHook(() => useTodayMarks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Failed to fetch marks");
  });

  it("returns entry metadata in each item", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse(mockMarksResponse)
    );

    const { result } = renderHook(() => useTodayMarks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const entry = result.current.data?.items[0];
    expect(entry?.entry_id).toBe(1);
    expect(entry?.entry_time).toBe("08:00");
    expect(entry?.schedule).toBe("morning");
  });
});
