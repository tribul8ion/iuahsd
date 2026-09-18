import { renderHook, act } from "@testing-library/react";
import { useUnlock } from "../use-unlock";
import { apiClient } from "@/shared/api";
import { deriveKey, makeKcv, makeSalt } from "@/shared/crypto";
import type { KdfParams } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import type { CryptoSettingsDto } from "@/shared/session";
import {
  createSuccessResponse,
  createErrorResponse,
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

const FAST_PARAMS: KdfParams = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
};

async function buildServerCrypto(passphrase: string): Promise<{
  settings: CryptoSettingsDto;
  key: Uint8Array;
}> {
  const salt = await makeSalt();
  const key = await deriveKey(passphrase, salt, FAST_PARAMS);
  const kcv = await makeKcv(key);
  return {
    settings: {
      salt,
      kdf_algorithm: "argon2id",
      kdf_memory_kib: FAST_PARAMS.memoryKib,
      kdf_iterations: FAST_PARAMS.iterations,
      kdf_parallelism: FAST_PARAMS.parallelism,
      kcv,
    },
    key,
  };
}

describe("useUnlock", () => {
  afterEach(() => vi.clearAllMocks());

  it("derives the key with server kdf params and unlocks on kcv match", async () => {
    const { settings, key } = await buildServerCrypto("correct-horse");
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse(settings));

    const { result } = renderHook(() => useUnlock());

    act(() => {
      result.current.setPassphrase("correct-horse");
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith("/me/salt");

    const session = useSessionStore.getState();
    expect(session.cryptoKey).toEqual(key);
    expect(session.bootState).toBe("ready");
    expect(result.current.passphrase).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("reports wrong passphrase when the kcv does not verify", async () => {
    const { settings } = await buildServerCrypto("correct-horse");
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse(settings));

    const { result } = renderHook(() => useUnlock());

    act(() => {
      result.current.setPassphrase("wrong-horse-123");
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("wrong_passphrase");
    expect(useSessionStore.getState().cryptoKey).toBeNull();
    expect(useSessionStore.getState().bootState).toBe("boot");
  });

  it("rejects an empty passphrase without hitting the API", async () => {
    const { result } = renderHook(() => useUnlock());

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("wrong_passphrase");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("reports request failure when the salt cannot be loaded", async () => {
    vi.mocked(apiClient.get).mockResolvedValue(
      createErrorResponse("crypto_not_initialized")
    );

    const { result } = renderHook(() => useUnlock());

    act(() => {
      result.current.setPassphrase("correct-horse");
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("request_failed");
  });
});
