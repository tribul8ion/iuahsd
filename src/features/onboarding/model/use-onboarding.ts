import { useCallback, useState } from "react";
import { apiClient } from "@/shared/api";
import {
  DEFAULT_KDF_PARAMS,
  deriveKey,
  keyToB64,
  makeKcv,
  makeSalt,
  saveKey,
  type KdfParams,
} from "@/shared/crypto";
import { checkPassphrase } from "@/shared/lib";
import { useSessionStore } from "@/shared/session";

export { MIN_PASSPHRASE_LENGTH } from "@/shared/lib";

export type OnboardingError =
  | "too_short"
  | "too_weak"
  | "mismatch"
  | "not_acknowledged"
  | "request_failed"
  | null;

export function useOnboarding(kdfParams: KdfParams = DEFAULT_KDF_PARAMS) {
  const setCryptoKey = useSessionStore((s) => s.setCryptoKey);
  const setBootState = useSessionStore((s) => s.setBootState);

  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<OnboardingError>(null);
  const [isDeriving, setIsDeriving] = useState(false);

  const submit = useCallback(async (): Promise<boolean> => {
    const verdict = checkPassphrase(passphrase);
    if (verdict !== "ok") {
      setError(verdict);
      return false;
    }
    if (passphrase !== confirmation) {
      setError("mismatch");
      return false;
    }
    if (!acknowledged) {
      setError("not_acknowledged");
      return false;
    }

    setError(null);
    setIsDeriving(true);
    try {
      const salt = await makeSalt();
      const key = await deriveKey(passphrase, salt, kdfParams);
      const kcv = await makeKcv(key);
      const response = await apiClient.post("/me/salt", {
        salt,
        kcv,
        kdf_memory_kib: kdfParams.memoryKib,
        kdf_iterations: kdfParams.iterations,
        kdf_parallelism: kdfParams.parallelism,
      });
      if (!response.success) {
        setError("request_failed");
        return false;
      }
      await saveKey(await keyToB64(key));
      setCryptoKey(key);
      setPassphrase("");
      setConfirmation("");
      setBootState("ready");
      return true;
    } catch {
      setError("request_failed");
      return false;
    } finally {
      setIsDeriving(false);
    }
  }, [passphrase, confirmation, acknowledged, kdfParams, setCryptoKey, setBootState]);

  return {
    passphrase,
    setPassphrase,
    confirmation,
    setConfirmation,
    acknowledged,
    setAcknowledged,
    error,
    isDeriving,
    submit,
  };
}
