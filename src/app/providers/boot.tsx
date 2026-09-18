import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { clearKey, keyFromB64, loadKey, verifyKcv } from "@/shared/crypto";
import {
  CRYPTO_NOT_INITIALIZED,
  nextStateAfterProfile,
  nextStateAfterSalt,
  useSessionStore,
} from "@/shared/session";
import type { CryptoSettingsDto } from "@/shared/session";
import { Spinner } from "@/shared/ui";
import { userKeys } from "@/entities/user";
import type { User } from "@/entities/user";
import { PrivacyConsentScreen, useConsent } from "@/features/privacy-consent";
import { OnboardingScreen } from "@/features/onboarding";
import { UnlockScreen } from "@/features/unlock";
import { AuthErrorScreen } from "./auth-error";

interface BootProviderProps {
  children: ReactNode;
}

export function BootProvider({ children }: BootProviderProps) {
  const bootState = useSessionStore((s) => s.bootState);
  const setBootState = useSessionStore((s) => s.setBootState);
  const setCryptoKey = useSessionStore((s) => s.setCryptoKey);
  const queryClient = useQueryClient();
  const consent = useConsent();
  const startedRef = useRef(false);
  const storedKeyRef = useRef<string | null>(null);

  const proceedToCrypto = useCallback(async () => {
    const response = await apiClient.get<CryptoSettingsDto>("/me/salt");
    if (!response.success || !response.data) {
      if (response.error === CRYPTO_NOT_INITIALIZED) {
        setBootState(nextStateAfterSalt({ saltExists: false, hasKey: false, kcvValid: false }));
        return;
      }
      setBootState("error");
      return;
    }

    let key: Uint8Array | null = null;
    let kcvValid = false;
    if (storedKeyRef.current) {
      try {
        key = await keyFromB64(storedKeyRef.current);
        kcvValid = await verifyKcv(response.data.kcv, key);
      } catch {
        kcvValid = false;
      }
      if (!kcvValid) {
        key = null;
        storedKeyRef.current = null;
        await clearKey();
      }
    }

    const next = nextStateAfterSalt({
      saltExists: true,
      hasKey: key !== null,
      kcvValid,
    });
    if (next === "ready" && key !== null) {
      setCryptoKey(key);
    }
    setBootState(next);
  }, [setBootState, setCryptoKey]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void (async () => {
      const [profileResponse, storedKey] = await Promise.all([
        apiClient.get<User>("/me"),
        loadKey(),
      ]);
      storedKeyRef.current = storedKey;

      if (!profileResponse.success || !profileResponse.data) {
        setBootState("error");
        return;
      }
      queryClient.setQueryData(userKeys.me(), profileResponse.data);

      const next = nextStateAfterProfile({
        needsConsentRefresh: profileResponse.data.needs_consent_refresh,
      });
      if (next === "consent") {
        setBootState("consent");
        return;
      }
      await proceedToCrypto();
    })();
  }, [proceedToCrypto, queryClient, setBootState]);

  const handleConsentAccept = useCallback(() => {
    const profile = queryClient.getQueryData<User>(userKeys.me());
    const policyVersion = profile?.current_policy_version ?? "";
    consent.mutate(policyVersion, {
      onSuccess: () => {
        void proceedToCrypto();
      },
    });
  }, [consent, proceedToCrypto, queryClient]);

  if (bootState === "boot") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (bootState === "error") {
    return <AuthErrorScreen />;
  }
  if (bootState === "consent") {
    return <PrivacyConsentScreen onAccept={handleConsentAccept} />;
  }
  if (bootState === "onboarding") {
    return <OnboardingScreen />;
  }
  if (bootState === "unlock") {
    return <UnlockScreen />;
  }

  return <>{children}</>;
}
