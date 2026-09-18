import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { closeApp } from "@/shared/lib";

export function AuthErrorScreen() {
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    closeApp();
  }, []);

  return (
    <div
      role="alert"
      className="min-h-dvh flex items-center justify-center px-6 text-center"
      style={{ backgroundColor: "transparent" }}
    >
      <div className="max-w-sm flex flex-col items-center">
        <h1
          className="text-[26px] font-bold"
          style={{ color: "var(--color-text)", lineHeight: 1.2 }}
        >
          {t("auth_error.title")}
        </h1>

        <div style={{ height: 8 }} />

        <p
          className="text-[15px] font-normal"
          style={{ color: "var(--color-text-hint)", lineHeight: 1.5 }}
        >
          {t("auth_error.message")}
        </p>

        <div style={{ height: 28 }} />

        <button
          type="button"
          onClick={handleClose}
          className="w-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98]"
          style={{
            height: 52,
            borderRadius: 22,
            background: "var(--gradient-primary)",
            boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)",
            color: "#2C3400",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {t("auth_error.close")}
        </button>
      </div>
    </div>
  );
}
