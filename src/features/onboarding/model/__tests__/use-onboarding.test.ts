import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "../use-onboarding";
import { apiClient } from "@/shared/api";
import { deriveKey, verifyKcv } from "@/shared/crypto";
import type { KdfParams } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
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

function fillValidForm(result: {
  current: ReturnType<typeof useOnboarding>;
}) {
  act(() => {
    result.current.setPassphrase("correct-horse-battery");
    result.current.setConfirmation("correct-horse-battery");
    result.current.setAcknowledged(true);
  });
}

describe("useOnboarding", () => {
  afterEach(() => vi.clearAllMocks());

  it("rejects passphrases shorter than 12 characters", async () => {
    const { result } = renderHook(() => useOnboarding(FAST_PARAMS));

    act(() => {
      result.current.setPassphrase("short");
      result.current.setConfirmation("short");
      result.current.setAcknowledged(true);
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("too_short");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("rejects mismatching confirmation", async () => {
    const { result } = renderHook(() => useOnboarding(FAST_PARAMS));

    act(() => {
      result.current.setPassphrase("correct-horse-battery");
      result.current.setConfirmation("wrong-horse-battery");
      result.current.setAcknowledged(true);
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("mismatch");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("requires the no-recovery acknowledgement", async () => {
    const { result } = renderHook(() => useOnboarding(FAST_PARAMS));

    act(() => {
      result.current.setPassphrase("correct-horse-battery");
      result.current.setConfirmation("correct-horse-battery");
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("not_acknowledged");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("initializes crypto: posts salt with kcv and kdf params, stores the key, clears inputs", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse({ salt: "s", kcv: "k" })
    );

    const { result } = renderHook(() => useOnboarding(FAST_PARAMS));
    fillValidForm(result);

    let ok = false;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(true);

    const [path, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      {
        salt: string;
        kcv: string;
        kdf_memory_kib: number;
        kdf_iterations: number;
        kdf_parallelism: number;
      },
    ];
    expect(path).toBe("/me/salt");
    expect(body.kdf_memory_kib).toBe(FAST_PARAMS.memoryKib);
    expect(body.kdf_iterations).toBe(FAST_PARAMS.iterations);
    expect(body.kdf_parallelism).toBe(FAST_PARAMS.parallelism);

    const expectedKey = await deriveKey("correct-horse-battery", body.salt, FAST_PARAMS);
    expect(await verifyKcv(body.kcv, expectedKey)).toBe(true);

    const session = useSessionStore.getState();
    expect(session.cryptoKey).toEqual(expectedKey);
    expect(session.bootState).toBe("ready");
    expect(result.current.passphrase).toBe("");
    expect(result.current.confirmation).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("reports request failure and keeps the session locked", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      createErrorResponse("crypto_already_initialized")
    );

    const { result } = renderHook(() => useOnboarding(FAST_PARAMS));
    fillValidForm(result);

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("request_failed");
    expect(useSessionStore.getState().cryptoKey).toBeNull();
    expect(useSessionStore.getState().bootState).toBe("boot");
  });
});
