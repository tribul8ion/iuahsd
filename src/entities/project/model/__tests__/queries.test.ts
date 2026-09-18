import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { projectKeys, useProjects } from "../queries";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import { encryptProjectPayload } from "@/shared/crypto";
import type { ProjectDto } from "../types";

const TEST_KEY: Uint8Array = new Uint8Array(32).fill(4);

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

function setSessionKey(key: Uint8Array | null) {
  useSessionStore.setState({ cryptoKey: key, bootState: key ? "ready" : "boot" });
}

function successResponse(projects: ProjectDto[]) {
  return { success: true, data: { projects }, error: null };
}

describe("projectKeys", () => {
  it("generates base and list keys", () => {
    expect(projectKeys.all).toEqual(["projects"]);
    expect(projectKeys.list()).toEqual(["projects", "list"]);
  });
});

describe("useProjects", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches and decrypts projects from /projects", async () => {
    const dto: ProjectDto = {
      id: 1,
      payload_encrypted: await encryptProjectPayload({ v: 1, name: "Move" }, TEST_KEY),
      total_tasks: 3,
      done_tasks: 1,
      created_at: "2026-02-01T00:00:00Z",
    };
    vi.mocked(apiClient.get).mockResolvedValue(successResponse([dto]));
    setSessionKey(TEST_KEY);

    const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/projects");
    expect(result.current.data).toEqual([
      { id: 1, name: "Move", total: 3, done: 1, created_at: "2026-02-01T00:00:00Z", corrupted: false },
    ]);
  });

  it("stays disabled without a crypto key", async () => {
    setSessionKey(null);

    const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() });

    expect(result.current.fetchStatus).toBe("idle");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("throws when the response is not successful", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      data: null,
      error: "Server error",
    });
    setSessionKey(TEST_KEY);

    const { result } = renderHook(() => useProjects(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Server error");
  });
});
