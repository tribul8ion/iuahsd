import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { hapticFeedback } from "@/shared/lib";
import { useUnlock } from "../model/use-unlock";

const ERROR_KEYS: Record<string, string> = {
  wrong_passphrase: "unlock.error_wrong",
  untrusted_params: "unlock.error_untrusted",
  request_failed: "unlock.error_request",
};

export function UnlockScreen() {
  const { t } = useTranslation();
  const { passphrase, setPassphrase, error, isDeriving, submit } = useUnlock();

  const handleSubmit = useCallback(() => {
    void submit().then((ok) => {
      hapticFeedback("notification", ok ? "success" : "error");
    });
  }, [submit]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: "transparent" }}
    >
      <div className="flex-1 flex flex-col" style={{ padding: "60px 24px 32px 24px" }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            flexShrink: 0,
            background: "var(--gradient-primary)",
          boxShadow: "0 16px 36px -12px rgba(249,255,208,0.2)",
          }}
        >
          <LockKeyhole size={32} color="#2C3400" strokeWidth={2} />
        </div>

        <div style={{ height: 24, flexShrink: 0 }} />

        <h1
          className="text-[27px] font-extrabold"
          style={{ color: "var(--color-text)", lineHeight: 1.2, flexShrink: 0, letterSpacing: "-0.4px" }}
        >
          {t("unlock.title")}
        </h1>

        <div style={{ height: 8, flexShrink: 0 }} />

        <p
          className="text-[15px] font-normal"
          style={{ color: "var(--color-text-hint)", lineHeight: 1.5, flexShrink: 0 }}
        >
          {t("unlock.subtitle")}
        </p>

        <div style={{ height: 28, flexShrink: 0 }} />

        <div className="flex flex-col" style={{ gap: 12, flexShrink: 0 }}>
          <div
            className="flex items-center rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "0 16px", height: 54, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
          >
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyUp={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={t("unlock.passphrase_placeholder")}
              className="w-full text-[15px] bg-transparent outline-none placeholder:text-[rgba(255,255,255,0.28)]"
              style={{ color: "var(--color-text)" }}
              aria-label="passphrase"
              autoComplete="current-password"
              autoFocus
            />
          </div>

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
            borderRadius: 22,
            background: "var(--gradient-primary)",
            boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)",
            color: "#2C3400",
            fontSize: 16,
            fontWeight: 700,
            gap: 8,
            flexShrink: 0,
          }}
        >
          {isDeriving && <Loader2 size={18} className="animate-spin" />}
          {isDeriving ? t("unlock.deriving") : t("unlock.submit")}
        </button>
      </div>
    </div>
  );
}
