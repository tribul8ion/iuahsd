import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, EyeOff, Trash2, HeartPulse, type LucideIcon } from "lucide-react";
import { hapticFeedback } from "@/shared/lib";

interface PrivacyConsentScreenProps {
  onAccept: () => void;
}

interface FeatureItem {
  icon: LucideIcon;
  labelKey: string;
}

const FEATURES: FeatureItem[] = [
  { icon: ShieldCheck, labelKey: "consent.feature_secure" },
  { icon: EyeOff, labelKey: "consent.feature_privacy" },
  { icon: Trash2, labelKey: "consent.feature_delete" },
];

export function PrivacyConsentScreen({ onAccept }: PrivacyConsentScreenProps) {
  const { t } = useTranslation();

  const handleAccept = useCallback(() => {
    hapticFeedback("notification", "success");
    onAccept();
  }, [onAccept]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="flex-1 flex flex-col"
        style={{ padding: "60px 24px 32px 24px" }}
      >
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
          <HeartPulse size={32} color="#2C3400" strokeWidth={2} />
        </div>

        <div style={{ height: 24, flexShrink: 0 }} />

        <h1
          className="text-[28px] font-bold whitespace-pre-line"
          style={{ color: "var(--color-text)", lineHeight: 1.2, flexShrink: 0 }}
        >
          {t("consent.welcome_title")}
        </h1>

        <div style={{ height: 8, flexShrink: 0 }} />

        <p
          className="text-[15px] font-normal whitespace-pre-line"
          style={{ color: "var(--color-text-hint)", lineHeight: 1.5, flexShrink: 0 }}
        >
          {t("consent.welcome_subtitle")}
        </p>

        <div style={{ height: 32, flexShrink: 0 }} />

        <div className="flex flex-col" style={{ gap: 16, flexShrink: 0 }}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.labelKey} className="flex items-center" style={{ gap: 12 }}>
                <Icon size={20} color="#F9FFD0" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span className="text-[14px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  {t(feature.labelKey)}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, minHeight: 32 }} />

        <div className="flex flex-col" style={{ gap: 12, flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleAccept}
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
            {t("consent.accept")}
          </button>

          <div className="flex items-center justify-center" style={{ gap: 4 }}>
            <span className="text-[12px] font-normal" style={{ color: "var(--color-text-hint)" }}>
              {t("consent.read_our")}
            </span>
            <a
              href="https://medreminderbot.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold"
              style={{ color: "#F9FFD0" }}
            >
              {t("consent.privacy_link")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
