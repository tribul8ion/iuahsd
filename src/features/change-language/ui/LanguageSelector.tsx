import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useChangeLanguage } from "../model/use-change-language";

const LANGUAGES = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const { mutate } = useChangeLanguage();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
    >
      <div className="flex items-center" style={{ height: 40, padding: "0 16px", backgroundColor: "#F5F5F4" }}>
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ color: "#A8A29E", letterSpacing: "1px" }}
        >
          {t("settings.language")}
        </span>
      </div>
      {LANGUAGES.map((lang, idx) => {
        const isSelected = i18n.language === lang.code;
        return (
          <div key={lang.code}>
            {idx > 0 && <div style={{ height: 1, backgroundColor: "#F5F5F4" }} />}
            <button
              onClick={() => mutate(lang.code)}
              className="flex items-center w-full cursor-pointer"
              style={{ gap: 12, padding: "0 16px", height: 48 }}
            >
              <span
                className="flex-1 text-left text-[15px]"
                style={{
                  color: isSelected ? "#1C1917" : "#57534E",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {lang.label}
              </span>
              {isSelected && <Check size={18} color="#059669" strokeWidth={2.5} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
