import { useCallback, useState } from "react";
import { apiClient } from "@/shared/api";
import {
  DEFAULT_KDF_PARAMS,
  WeakKdfParamsError,
  decryptPayload,
  decryptProjectPayload,
  deriveKey,
  encryptPayload,
  encryptProjectPayload,
  keyToB64,
  makeKcv,
  makeSalt,
  saveKey,
  verifyKcv,
  type KdfParams,
  type EntryPayloadV1,
  type ProjectPayloadV1,
} from "@/shared/crypto";
import { checkPassphrase } from "@/shared/lib";
import { useSessionStore } from "@/shared/session";
import type { CryptoSettingsDto } from "@/shared/session";
import type { EntryDto } from "@/entities/entry";
import type { ProjectDto } from "@/entities/project";

export { MIN_PASSPHRASE_LENGTH } from "@/shared/lib";

export type ChangePassphraseError =
  | "wrong_old_passphrase"
  | "too_short"
  | "too_weak"
  | "mismatch"
  | "decrypt_failed"
  | "reauth_required"
  | "untrusted_params"
  | "request_failed"
  | null;

export type ChangePassphrasePhase =
  | "idle"
  | "verifying"
  | "decrypting"
  | "reencrypting"
  | "done";

interface ReencryptItem {
  id: number;
  payload_encrypted: string;
}

interface EntryListResponse {
  entries: EntryDto[];
}

interface ProjectListResponse {
  projects: ProjectDto[];
}

interface ReencryptResult {
  updated: number;
  projects_updated: number;
}

interface DecryptedVault {
  entries: { id: number; payload: EntryPayloadV1 }[];
  projects: { id: number; payload: ProjectPayloadV1 }[];
}

type Result<T> = { ok: true; value: T } | { ok: false; error: ChangePassphraseError };

async function resolveOldKey(
  oldPassphrase: string,
  cryptoKey: Uint8Array | null
): Promise<Result<Uint8Array>> {
  if (!oldPassphrase) {
    if (cryptoKey === null) {
      return { ok: false, error: "wrong_old_passphrase" };
    }
    return { ok: true, value: cryptoKey };
  }

  try {
    const response = await apiClient.get<CryptoSettingsDto>("/me/salt");
    if (!response.success || !response.data) {
      return { ok: false, error: "request_failed" };
    }
    const settings = response.data;
    const key = await deriveKey(oldPassphrase, settings.salt, {
      memoryKib: settings.kdf_memory_kib,
      iterations: settings.kdf_iterations,
      parallelism: settings.kdf_parallelism,
    });
    const valid = await verifyKcv(settings.kcv, key);
    if (!valid) {
      return { ok: false, error: "wrong_old_passphrase" };
    }
    return { ok: true, value: key };
  } catch (error) {
    if (error instanceof WeakKdfParamsError) {
      return { ok: false, error: "untrusted_params" };
    }
    return { ok: false, error: "request_failed" };
  }
}

async function fetchVault(): Promise<Result<{ entries: EntryDto[]; projects: ProjectDto[] }>> {
  try {
    const [entriesResponse, projectsResponse] = await Promise.all([
      apiClient.get<EntryListResponse>("/entries"),
      apiClient.get<ProjectListResponse>("/projects"),
    ]);
    if (!entriesResponse.success || !entriesResponse.data) {
      return { ok: false, error: "request_failed" };
    }
    if (!projectsResponse.success || !projectsResponse.data) {
      return { ok: false, error: "request_failed" };
    }
    return {
      ok: true,
      value: {
        entries: entriesResponse.data.entries,
        projects: projectsResponse.data.projects,
      },
    };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}

async function decryptVault(
  source: { entries: EntryDto[]; projects: ProjectDto[] },
  key: Uint8Array,
  onProgress: (current: number) => void
): Promise<Result<DecryptedVault>> {
  const entries: DecryptedVault["entries"] = [];
  const projects: DecryptedVault["projects"] = [];
  let done = 0;
  try {
    for (const entry of source.entries) {
      entries.push({ id: entry.id, payload: await decryptPayload(entry.payload_encrypted, key) });
      onProgress(++done);
    }
    for (const project of source.projects) {
      projects.push({
        id: project.id,
        payload: await decryptProjectPayload(project.payload_encrypted, key),
      });
      onProgress(++done);
    }
    return { ok: true, value: { entries, projects } };
  } catch {
    return { ok: false, error: "decrypt_failed" };
  }
}

async function buildNewCrypto(
  newPassphrase: string,
  kdfParams: KdfParams
): Promise<{ salt: string; key: Uint8Array; kcv: string }> {
  const salt = await makeSalt();
  const key = await deriveKey(newPassphrase, salt, kdfParams);
  const kcv = await makeKcv(key);
  return { salt, key, kcv };
}

async function reencryptVault(
  vault: DecryptedVault,
  key: Uint8Array,
  onProgress: (current: number) => void
): Promise<{ items: ReencryptItem[]; projects: ReencryptItem[] }> {
  const items: ReencryptItem[] = [];
  const projects: ReencryptItem[] = [];
  let done = 0;
  for (const entry of vault.entries) {
    items.push({ id: entry.id, payload_encrypted: await encryptPayload(entry.payload, key) });
    onProgress(++done);
  }
  for (const project of vault.projects) {
    projects.push({
      id: project.id,
      payload_encrypted: await encryptProjectPayload(project.payload, key),
    });
    onProgress(++done);
  }
  return { items, projects };
}

async function submitReencrypt(
  salt: string,
  kcv: string,
  kdfParams: KdfParams,
  payload: { items: ReencryptItem[]; projects: ReencryptItem[] }
): Promise<Result<ReencryptResult>> {
  try {
    const response = await apiClient.put<ReencryptResult>(
      "/me/reencrypt",
      {
        salt,
        kcv,
        kdf_memory_kib: kdfParams.memoryKib,
        kdf_iterations: kdfParams.iterations,
        kdf_parallelism: kdfParams.parallelism,
        items: payload.items,
        projects: payload.projects,
      },
      true
    );
    if (!response.success || !response.data) {
      if (response.error === "reauth_required") {
        return { ok: false, error: "reauth_required" };
      }
      return { ok: false, error: "request_failed" };
    }
    return { ok: true, value: response.data };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}

export function useChangePassphrase(kdfParams: KdfParams = DEFAULT_KDF_PARAMS) {
  const cryptoKey = useSessionStore((s) => s.cryptoKey);
  const setCryptoKey = useSessionStore((s) => s.setCryptoKey);

  const [oldPassphrase, setOldPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<ChangePassphraseError>(null);
  const [phase, setPhase] = useState<ChangePassphrasePhase>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const reset = useCallback(() => {
    setOldPassphrase("");
    setNewPassphrase("");
    setConfirmation("");
    setError(null);
    setPhase("idle");
    setProgress({ current: 0, total: 0 });
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    const verdict = checkPassphrase(newPassphrase);
    if (verdict !== "ok") {
      setError(verdict);
      return false;
    }
    if (newPassphrase !== confirmation) {
      setError("mismatch");
      return false;
    }

    const fail = (reason: ChangePassphraseError): false => {
      setError(reason);
      setPhase("idle");
      return false;
    };

    setError(null);
    setPhase("verifying");

    const keyResult = await resolveOldKey(oldPassphrase, cryptoKey);
    if (!keyResult.ok) {
      return fail(keyResult.error);
    }

    const vaultResult = await fetchVault();
    if (!vaultResult.ok) {
      return fail(vaultResult.error);
    }

    const total = vaultResult.value.entries.length + vaultResult.value.projects.length;
    setPhase("decrypting");
    setProgress({ current: 0, total });
    const decryptResult = await decryptVault(vaultResult.value, keyResult.value, (current) =>
      setProgress({ current, total })
    );
    if (!decryptResult.ok) {
      return fail(decryptResult.error);
    }

    setPhase("reencrypting");
    setProgress({ current: 0, total });

    let newCrypto: { salt: string; key: Uint8Array; kcv: string };
    let payload: { items: ReencryptItem[]; projects: ReencryptItem[] };
    try {
      newCrypto = await buildNewCrypto(newPassphrase, kdfParams);
      payload = await reencryptVault(decryptResult.value, newCrypto.key, (current) =>
        setProgress({ current, total })
      );
    } catch (exc) {
      return fail(exc instanceof WeakKdfParamsError ? "untrusted_params" : "request_failed");
    }

    const putResult = await submitReencrypt(
      newCrypto.salt,
      newCrypto.kcv,
      kdfParams,
      payload
    );
    if (!putResult.ok) {
      return fail(putResult.error);
    }

    await saveKey(await keyToB64(newCrypto.key));
    setCryptoKey(newCrypto.key);
    setPhase("done");
    setOldPassphrase("");
    setNewPassphrase("");
    setConfirmation("");
    return true;
  }, [oldPassphrase, newPassphrase, confirmation, cryptoKey, kdfParams, setCryptoKey]);

  return {
    oldPassphrase,
    setOldPassphrase,
    newPassphrase,
    setNewPassphrase,
    confirmation,
    setConfirmation,
    error,
    phase,
    progress,
    isBusy: phase !== "idle" && phase !== "done",
    reset,
    submit,
  };
}
