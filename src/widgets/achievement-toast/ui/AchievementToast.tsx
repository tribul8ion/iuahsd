import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ACHIEVEMENTS } from "@/entities/achievement";
import { useAchievementQueueStore } from "@/features/mark-taken";
import { hapticFeedback } from "@/shared/lib";
import { Confetti } from "@/shared/ui";

export function AchievementToast() {
  const { t } = useTranslation();
  const currentId = useAchievementQueueStore((s) => s.queue[0]);
  const dequeue = useAchievementQueueStore((s) => s.dequeue);

  useEffect(() => {
    if (currentId) {
      hapticFeedback("notification", "success");
    }
  }, [currentId]);

  if (!currentId) {
    return null;
  }

  const badge = ACHIEVEMENTS.find((a) => a.id === currentId);
  if (!badge) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center animate-fade-in"
      style={{ backgroundColor: "rgba(28, 25, 23, 0.5)" }}
    >
      <Confetti />
      <div
        className="bg-white rounded-[24px] flex flex-col items-center animate-scale-in"
        style={{ padding: "32px 28px", gap: 12, maxWidth: 280 }}
      >
        <span style={{ fontSize: 56, lineHeight: 1 }}>{badge.emoji}</span>
        <p className="text-[13px] font-semibold uppercase" style={{ color: "var(--color-text-hint)", letterSpacing: "1px" }}>
          {t("toast.unlocked")}
        </p>
        <p className="text-[18px] font-bold text-center" style={{ color: "var(--color-text)" }}>
          {t(badge.nameKey)}
        </p>
        <button
          onClick={dequeue}
          className="w-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-[0.98]"
          style={{ height: 44, borderRadius: 22, background: "var(--gradient-primary)", marginTop: 8, boxShadow: "0 10px 24px -6px rgba(249,255,208,0.18), inset 0 1px 0 rgba(255,255,255,0.4)" }}
        >
          <span className="text-[15px] font-semibold text-[#2C3400]">{t("toast.close")}</span>
        </button>
      </div>
    </div>
  );
}
