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
      style={{ backgroundColor: "#F0F4F3" }}
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
            background: "linear-gradient(160deg, #059669 0%, #0D9488 100%)",
          }}
        >
          <HeartPulse size={32} color="#FFFFFF" strokeWidth={2} />
        </div>

        <div style={{ height: 24, flexShrink: 0 }} />

        <h1
          className="text-[28px] font-bold whitespace-pre-line"
          style={{ color: "#1C1917", lineHeight: 1.2, flexShrink: 0 }}
        >
          {t("consent.welcome_title")}
        </h1>

        <div style={{ height: 8, flexShrink: 0 }} />

        <p
          className="text-[15px] font-normal whitespace-pre-line"
          style={{ color: "#A8A29E", lineHeight: 1.5, flexShrink: 0 }}
        >
          {t("consent.welcome_subtitle")}
        </p>

        <div style={{ height: 32, flexShrink: 0 }} />

        <div className="flex flex-col" style={{ gap: 16, flexShrink: 0 }}>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.labelKey} className="flex items-center" style={{ gap: 12 }}>
                <Icon size={20} color="#059669" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span className="text-[14px] font-medium" style={{ color: "#57534E" }}>
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
              borderRadius: 16,
              backgroundColor: "#059669",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {t("consent.accept")}
          </button>

          <div className="flex items-center justify-center" style={{ gap: 4 }}>
            <span className="text-[12px] font-normal" style={{ color: "#A8A29E" }}>
              {t("consent.read_our")}
            </span>
            <a
              href="https://medreminderbot.app/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold"
              style={{ color: "#059669" }}
            >
              {t("consent.privacy_link")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
