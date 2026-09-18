import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { petKeys, usePet } from "../queries";
import { apiClient } from "@/shared/api";
import { createErrorResponse, createSuccessResponse } from "@/test/mocks/handlers";
import type { PetDto } from "../types";

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
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("petKeys", () => {
  it("generates base and detail keys", () => {
    expect(petKeys.all).toEqual(["pet"]);
    expect(petKeys.detail()).toEqual(["pet", "detail"]);
  });
});

describe("usePet", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches pet state from /pet", async () => {
    const pet: PetDto = { xp: 80, level: 1, next_level_xp: 100 };
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse(pet));

    const { result } = renderHook(() => usePet(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/pet");
    expect(result.current.data).toEqual(pet);
  });

  it("returns xp 0 and level 1 for a brand new pet", async () => {
    const pet: PetDto = { xp: 0, level: 1, next_level_xp: 100 };
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse(pet));

    const { result } = renderHook(() => usePet(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ xp: 0, level: 1, next_level_xp: 100 });
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(createErrorResponse("Server error"));

    const { result } = renderHook(() => usePet(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Server error");
  });
});
