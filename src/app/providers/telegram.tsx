import { useEffect, type ReactNode } from "react";
import { useUserStore } from "@/entities/user";
import { getUserLanguage } from "@/shared/lib";
import i18n from "./i18n";

interface TelegramProviderProps {
  children: ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const setLanguage = useUserStore((s) => s.setLanguage);

  useEffect(() => {
    try {
      window.Telegram?.WebApp?.ready();
      window.Telegram?.WebApp?.expand();
    } catch {
      void 0;
    }

    const lang = getUserLanguage();
    const supported = ["ru", "en"];
    const resolvedLang = supported.includes(lang) ? lang : "en";

    setLanguage(resolvedLang);
    i18n.changeLanguage(resolvedLang);
  }, [setLanguage]);

  return (
    <div className="min-h-dvh bg-surface">
      {children}
    </div>
  );
}
