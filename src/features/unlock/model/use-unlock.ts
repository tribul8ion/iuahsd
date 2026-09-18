import { useCallback, useState } from "react";
import { apiClient } from "@/shared/api";
import {
  WeakKdfParamsError,
  deriveKey,
  keyToB64,
  saveKey,
  verifyKcv,
} from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import type { CryptoSettingsDto } from "@/shared/session";

export type UnlockError =
  | "wrong_passphrase"
  | "untrusted_params"
  | "request_failed"
  | null;

export function useUnlock() {
  const setCryptoKey = useSessionStore((s) => s.setCryptoKey);
  const setBootState = useSessionStore((s) => s.setBootState);

  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<UnlockError>(null);
  const [isDeriving, setIsDeriving] = useState(false);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!passphrase) {
      setError("wrong_passphrase");
      return false;
    }

    setError(null);
    setIsDeriving(true);
    try {
      const response = await apiClient.get<CryptoSettingsDto>("/me/salt");
      if (!response.success || !response.data) {
        setError("request_failed");
        return false;
      }
      const settings = response.data;
      const key = await deriveKey(passphrase, settings.salt, {
        memoryKib: settings.kdf_memory_kib,
        iterations: settings.kdf_iterations,
        parallelism: settings.kdf_parallelism,
      });
      const valid = await verifyKcv(settings.kcv, key);
      if (!valid) {
        setError("wrong_passphrase");
        return false;
      }
      await saveKey(await keyToB64(key));
      setCryptoKey(key);
      setPassphrase("");
      setBootState("ready");
      return true;
    } catch (error) {
      setError(
        error instanceof WeakKdfParamsError ? "untrusted_params" : "request_failed"
      );
      return false;
    } finally {
      setIsDeriving(false);
    }
  }, [passphrase, setCryptoKey, setBootState]);

  return { passphrase, setPassphrase, error, isDeriving, submit };
}
