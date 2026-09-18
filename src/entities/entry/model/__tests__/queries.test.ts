import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { entryKeys, useEntries } from "../queries";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  createErrorResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
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

function setSessionKey(key: Uint8Array | null) {
  useSessionStore.setState({ cryptoKey: key, bootState: key ? "ready" : "boot" });
}

describe("entryKeys", () => {
  it("generates base key", () => {
    expect(entryKeys.all).toEqual(["entries"]);
  });

  it("generates list key extending base", () => {
    expect(entryKeys.list()).toEqual(["entries", "list"]);
  });
});

describe("useEntries", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and decrypts entries from /entries endpoint", async () => {
    const dtos = await Promise.all(mockEntries.map((m) => buildEntryDto(m)));
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse({ entries: dtos, count: dtos.length })
    );
    setSessionKey(TEST_CRYPTO_KEY);

    const { result } = renderHook(() => useEntries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/entries");
    expect(result.current.data).toEqual(mockEntries);
  });

  it("marks entries as corrupted when decryption fails instead of throwing", async () => {
    const [good, bad] = await Promise.all(
      mockEntries.map((m) => buildEntryDto(m))
    );
    const tampered = { ...bad, payload_encrypted: "AAAA" + bad.payload_encrypted.slice(4) };
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse({ entries: [good, tampered], count: 2 })
    );
    setSessionKey(TEST_CRYPTO_KEY);

    const { result } = renderHook(() => useEntries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].corrupted).toBe(false);
    expect(result.current.data?.[0].name).toBe("Aspirin");
    expect(result.current.data?.[1].corrupted).toBe(true);
    expect(result.current.data?.[1].name).toBe("");
    expect(result.current.data?.[1].id).toBe(tampered.id);
    expect(result.current.data?.[1].schedule).toBe(tampered.schedule);
  });

  it("marks entries as corrupted when decrypted with a wrong key", async () => {
    const otherKey = new Uint8Array(32).fill(9);
    const dto = await buildEntryDto(mockEntries[0], otherKey);
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse({ entries: [dto], count: 1 })
    );
    setSessionKey(TEST_CRYPTO_KEY);

    const { result } = renderHook(() => useEntries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].corrupted).toBe(true);
  });

  it("stays disabled without a crypto key", async () => {
    setSessionKey(null);

    const { result } = renderHook(() => useEntries(), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createErrorResponse("Server error")
    );
    setSessionKey(TEST_CRYPTO_KEY);

    const { result } = renderHook(() => useEntries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Server error");
  });

  it("throws fallback message when error is null", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      success: false,
      data: null,
      error: null,
    });
    setSessionKey(TEST_CRYPTO_KEY);

    const { result } = renderHook(() => useEntries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Failed to fetch entries");
  });
});
