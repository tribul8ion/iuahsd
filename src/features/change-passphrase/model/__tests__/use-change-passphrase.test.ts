import { renderHook, act } from "@testing-library/react";
import { useChangePassphrase } from "../use-change-passphrase";
import { apiClient } from "@/shared/api";
import {
  decryptPayload,
  decryptProjectPayload,
  encryptProjectPayload,
  makeSalt,
} from "@/shared/crypto";
import type { KdfParams } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  createErrorResponse,
  mockEntries,
  buildEntryDto,
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

const FAST_PARAMS: KdfParams = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
};

function mockVault(entries: unknown[], projects: unknown[] = []) {
  vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
    if (path === "/projects") {
      return createSuccessResponse({ projects }) as never;
    }
    return createSuccessResponse({ entries, count: entries.length }) as never;
  });
}

function fillNewPassphrase(result: { current: ReturnType<typeof useChangePassphrase> }) {
  act(() => {
    result.current.setNewPassphrase("new-correct-horse-staple");
    result.current.setConfirmation("new-correct-horse-staple");
  });
}

describe("useChangePassphrase", () => {
  afterEach(() => vi.clearAllMocks());

  it("rejects a new passphrase shorter than 12 characters", async () => {
    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));

    act(() => {
      result.current.setNewPassphrase("short");
      result.current.setConfirmation("short");
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("too_short");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("rejects mismatching confirmation", async () => {
    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));

    act(() => {
      result.current.setNewPassphrase("new-correct-horse-staple");
      result.current.setConfirmation("different-horse-staple");
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("mismatch");
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("re-encrypts every entry of every kind with the key from the key-store and saves the new key", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    const dtos = await Promise.all(mockEntries.map((m) => buildEntryDto(m)));
    mockVault(dtos);
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse({ updated: dtos.length, projects_updated: 0 })
    );

    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));
    fillNewPassphrase(result);

    let ok = false;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith("/entries");
    expect(apiClient.get).toHaveBeenCalledWith("/projects");
    expect(mockEntries.some((e) => e.kind === "habit")).toBe(true);

    const [path, body] = vi.mocked(apiClient.put).mock.calls[0] as [
      string,
      {
        salt: string;
        kcv: string;
        items: { id: number; payload_encrypted: string }[];
        projects: { id: number; payload_encrypted: string }[];
      },
    ];
    expect(path).toBe("/me/reencrypt");
    expect(body.items).toHaveLength(mockEntries.length);

    const newKey = useSessionStore.getState().cryptoKey;
    expect(newKey).not.toEqual(TEST_CRYPTO_KEY);

    for (const item of body.items) {
      const payload = await decryptPayload(item.payload_encrypted, newKey!);
      const original = mockEntries.find((m) => m.id === item.id);
      expect(payload.name).toBe(original?.name);
    }

    expect(result.current.error).toBeNull();
    expect(result.current.phase).toBe("done");
    expect(result.current.newPassphrase).toBe("");
    expect(result.current.confirmation).toBe("");
  });

  it("re-encrypts projects together with entries and steps up the request", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    const dtos = await Promise.all(mockEntries.map((m) => buildEntryDto(m)));
    const projectPayload = await encryptProjectPayload(
      { v: 1, name: "Ремонт" },
      TEST_CRYPTO_KEY
    );
    mockVault(dtos, [
      {
        id: 7,
        payload_encrypted: projectPayload,
        total_tasks: 0,
        done_tasks: 0,
        created_at: null,
      },
    ]);
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse({ updated: dtos.length, projects_updated: 1 })
    );

    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));
    fillNewPassphrase(result);

    let ok = false;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(true);

    const [, body, stepUp] = vi.mocked(apiClient.put).mock.calls[0] as [
      string,
      { projects: { id: number; payload_encrypted: string }[] },
      boolean,
    ];
    expect(stepUp).toBe(true);
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].id).toBe(7);

    const newKey = useSessionStore.getState().cryptoKey;
    const decrypted = await decryptProjectPayload(
      body.projects[0].payload_encrypted,
      newKey!
    );
    expect(decrypted.name).toBe("Ремонт");
  });

  it("aborts without changing anything when an old passphrase fails to verify", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    const salt = await makeSalt();
    vi.mocked(apiClient.get).mockResolvedValue(
      createSuccessResponse({
        salt,
        kdf_algorithm: "argon2id",
        kdf_memory_kib: FAST_PARAMS.memoryKib,
        kdf_iterations: FAST_PARAMS.iterations,
        kdf_parallelism: FAST_PARAMS.parallelism,
        kcv: "not-a-valid-kcv",
      })
    );

    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));
    act(() => {
      result.current.setOldPassphrase("wrong-old-word");
    });
    fillNewPassphrase(result);

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("wrong_old_passphrase");
    expect(apiClient.put).not.toHaveBeenCalled();
    expect(useSessionStore.getState().cryptoKey).toEqual(TEST_CRYPTO_KEY);
  });

  it("cancels the whole flow and changes nothing when a payload fails to decrypt", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    const [good, bad] = await Promise.all(mockEntries.map((m) => buildEntryDto(m)));
    const tampered = { ...bad, payload_encrypted: "AAAA" + bad.payload_encrypted.slice(4) };
    mockVault([good, tampered]);

    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));
    fillNewPassphrase(result);

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("decrypt_failed");
    expect(apiClient.put).not.toHaveBeenCalled();
    expect(useSessionStore.getState().cryptoKey).toEqual(TEST_CRYPTO_KEY);
    expect(result.current.phase).toBe("idle");
  });

  it("reports request failure and keeps the old key when reencrypt is rejected", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    const dtos = await Promise.all(mockEntries.map((m) => buildEntryDto(m)));
    mockVault(dtos);
    vi.mocked(apiClient.put).mockResolvedValue(createErrorResponse("reencrypt_incomplete"));

    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));
    fillNewPassphrase(result);

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("request_failed");
    expect(useSessionStore.getState().cryptoKey).toEqual(TEST_CRYPTO_KEY);
  });

  it("fails when there is no old passphrase and no key in the key-store", async () => {
    useSessionStore.setState({ cryptoKey: null, bootState: "boot" });

    const { result } = renderHook(() => useChangePassphrase(FAST_PARAMS));
    fillNewPassphrase(result);

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe("wrong_old_passphrase");
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
