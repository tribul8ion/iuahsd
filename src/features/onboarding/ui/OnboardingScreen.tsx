import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { hapticFeedback } from "@/shared/lib";
import { useOnboarding } from "../model/use-onboarding";

const ERROR_KEYS: Record<string, string> = {
  too_short: "onboarding.error_short",
  too_weak: "onboarding.error_weak",
  mismatch: "onboarding.error_mismatch",
  not_acknowledged: "onboarding.error_ack",
  request_failed: "onboarding.error_request",
};

export function OnboardingScreen() {
  const { t } = useTranslation();
  const {
    passphrase,
    setPassphrase,
    confirmation,
    setConfirmation,
    acknowledged,
    setAcknowledged,
    error,
    isDeriving,
    submit,
  } = useOnboarding();

  const handleSubmit = useCallback(() => {
    void submit().then((ok) => {
      hapticFeedback("notification", ok ? "success" : "error");
    });
  }, [submit]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: "#F2F6F4" }}
    >
      <div className="flex-1 flex flex-col" style={{ padding: "60px 24px 32px 24px" }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            flexShrink: 0,
            background: "var(--gradient-header)",
          boxShadow: "0 14px 30px -10px rgba(5,150,105,0.5)",
          }}
        >
          <KeyRound size={32} color="#FFFFFF" strokeWidth={2} />
        </div>

        <div style={{ height: 24, flexShrink: 0 }} />

        <h1
          className="text-[27px] font-extrabold"
          style={{ color: "#1C1917", lineHeight: 1.2, flexShrink: 0, letterSpacing: "-0.4px" }}
        >
          {t("onboarding.title")}
        </h1>

        <div style={{ height: 8, flexShrink: 0 }} />

        <p
          className="text-[15px] font-normal"
          style={{ color: "#A8A29E", lineHeight: 1.5, flexShrink: 0 }}
        >
          {t("onboarding.subtitle")}
        </p>

        <div style={{ height: 28, flexShrink: 0 }} />

        <div className="flex flex-col" style={{ gap: 12, flexShrink: 0 }}>
          <div
            className="flex items-center rounded-2xl"
            style={{ backgroundColor: "#FFFFFF", padding: "0 16px", height: 54, border: "1px solid rgba(30,41,59,0.08)", boxShadow: "0 1px 2px rgba(30,41,59,0.04)" }}
          >
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={t("onboarding.passphrase_placeholder")}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
              style={{ color: "#1C1917" }}
              aria-label="passphrase"
              autoComplete="new-password"
            />
          </div>

          <div
            className="flex items-center rounded-2xl"
            style={{ backgroundColor: "#FFFFFF", padding: "0 16px", height: 54, border: "1px solid rgba(30,41,59,0.08)", boxShadow: "0 1px 2px rgba(30,41,59,0.04)" }}
          >
            <input
              type="password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={t("onboarding.confirm_placeholder")}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-[#D6D3D1]"
              style={{ color: "#1C1917" }}
              aria-label="passphrase-confirmation"
              autoComplete="new-password"
            />
          </div>

          <label
            className="flex items-start cursor-pointer"
            style={{ gap: 10, padding: "4px 2px" }}
          >
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              aria-label="acknowledge-no-recovery"
              style={{ marginTop: 3, accentColor: "#059669", width: 16, height: 16 }}
            />
            <span className="text-[13px]" style={{ color: "#57534E", lineHeight: 1.45 }}>
              {t("onboarding.ack")}
            </span>
          </label>

          {error && (
            <div className="flex items-center" style={{ gap: 8 }} role="alert">
              <ShieldAlert size={16} color="#E11D48" strokeWidth={2} />
              <span className="text-[13px] font-medium" style={{ color: "#E11D48" }}>
                {t(ERROR_KEYS[error])}
              </span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 24 }} />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDeriving}
          className="w-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            height: 52,
            borderRadius: 18,
            background: "var(--gradient-primary)",
            boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)",
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: 700,
            gap: 8,
            flexShrink: 0,
          }}
        >
          {isDeriving && <Loader2 size={18} className="animate-spin" />}
          {isDeriving ? t("onboarding.deriving") : t("onboarding.submit")}
        </button>
      </div>
    </div>
  );
}
