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
      style={{ backgroundColor: "#F0F4F3" }}
    >
      <div className="max-w-sm flex flex-col items-center">
        <h1
          className="text-[26px] font-bold"
          style={{ color: "#1C1917", lineHeight: 1.2 }}
        >
          {t("auth_error.title")}
        </h1>

        <div style={{ height: 8 }} />

        <p
          className="text-[15px] font-normal"
          style={{ color: "#A8A29E", lineHeight: 1.5 }}
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
            borderRadius: 16,
            background: "var(--gradient-primary)",
            boxShadow: "0 8px 18px -6px rgba(5,150,105,0.4)",
            color: "#FFFFFF",
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
