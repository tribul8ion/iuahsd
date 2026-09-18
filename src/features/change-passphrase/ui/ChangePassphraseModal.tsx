import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Loader2, ShieldAlert, X } from "lucide-react";
import { BottomSheet } from "@/shared/ui";
import { hapticFeedback } from "@/shared/lib";
import { useChangePassphrase } from "../model/use-change-passphrase";

interface ChangePassphraseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ERROR_KEYS: Record<string, string> = {
  wrong_old_passphrase: "change_passphrase.error_wrong_old",
  too_short: "change_passphrase.error_short",
  too_weak: "change_passphrase.error_weak",
  mismatch: "change_passphrase.error_mismatch",
  decrypt_failed: "change_passphrase.error_decrypt",
  reauth_required: "change_passphrase.error_reauth",
  untrusted_params: "change_passphrase.error_untrusted",
  request_failed: "change_passphrase.error_request",
};

const PHASE_KEYS: Record<string, string> = {
  verifying: "change_passphrase.phase_verifying",
  decrypting: "change_passphrase.phase_decrypting",
  reencrypting: "change_passphrase.phase_reencrypting",
};

export function ChangePassphraseModal({ isOpen, onClose }: ChangePassphraseModalProps) {
  const { t } = useTranslation();
  const {
    oldPassphrase,
    setOldPassphrase,
    newPassphrase,
    setNewPassphrase,
    confirmation,
    setConfirmation,
    error,
    phase,
    progress,
    isBusy,
    reset,
    submit,
  } = useChangePassphrase();

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleSubmit = useCallback(() => {
    void submit().then((ok) => {
      hapticFeedback("notification", ok ? "success" : "error");
      if (ok) {
        onClose();
      }
    });
  }, [submit, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: "8px 20px calc(24px + env(safe-area-inset-bottom)) 20px" }}>
        <div className="flex items-center justify-between h-12 mb-2">
          <div className="flex items-center" style={{ gap: 10 }}>
            <KeyRound size={20} color="#059669" strokeWidth={2} />
            <h2 className="text-[18px] font-bold" style={{ color: "#1C1917" }}>
              {t("change_passphrase.title")}
            </h2>
          </div>
          <button onClick={onClose} className="cursor-pointer p-1" aria-label="close">
            <X size={20} color="#A8A29E" strokeWidth={2} />
          </button>
        </div>

        <p className="text-[13px]" style={{ color: "#A8A29E", lineHeight: 1.5, marginBottom: 16 }}>
          {t("change_passphrase.subtitle")}
        </p>

        <div className="flex flex-col" style={{ gap: 10 }}>
          <div
            className="flex items-center rounded-xl"
            style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
          >
            <input
              type="password"
              value={oldPassphrase}
              onChange={(e) => setOldPassphrase(e.target.value)}
              placeholder={t("change_passphrase.old_placeholder")}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
              style={{ color: "#1C1917" }}
              aria-label="old-passphrase"
              autoComplete="current-password"
              disabled={isBusy}
            />
          </div>

          <div
            className="flex items-center rounded-xl"
            style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
          >
            <input
              type="password"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              placeholder={t("change_passphrase.new_placeholder")}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
              style={{ color: "#1C1917" }}
              aria-label="new-passphrase"
              autoComplete="new-password"
              disabled={isBusy}
            />
          </div>

          <div
            className="flex items-center rounded-xl"
            style={{ backgroundColor: "#F5F5F4", padding: "0 14px", height: 48 }}
          >
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={t("change_passphrase.confirm_placeholder")}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
              style={{ color: "#1C1917" }}
              aria-label="new-passphrase-confirmation"
              autoComplete="new-password"
              disabled={isBusy}
            />
          </div>

          {isBusy && (
            <div className="flex items-center" style={{ gap: 8 }} role="status">
              <Loader2 size={16} className="animate-spin" color="#059669" />
              <span className="text-[13px] font-medium" style={{ color: "#57534E" }}>
                {t(PHASE_KEYS[phase] ?? "change_passphrase.phase_verifying")}
                {progress.total > 0 &&
                  phase !== "verifying" &&
                  ` (${progress.current}/${progress.total})`}
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center" style={{ gap: 8 }} role="alert">
              <ShieldAlert size={16} color="#E11D48" strokeWidth={2} />
              <span className="text-[13px] font-medium" style={{ color: "#E11D48" }}>
                {t(ERROR_KEYS[error])}
              </span>
            </div>
          )}
        </div>

        <div style={{ height: 20 }} />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBusy}
          className="w-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            height: 48,
            borderRadius: 14,
            background: "var(--gradient-primary)",
            boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 700,
            gap: 8,
          }}
        >
          {isBusy && <Loader2 size={16} className="animate-spin" />}
          {t("change_passphrase.submit")}
        </button>
      </div>
    </BottomSheet>
  );
}
