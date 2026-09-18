import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { TodayFeed } from "@/widgets/today-feed";
import { usePet, stageEmojiForLevel, moodForProgress } from "@/entities/pet";
import { useTodayMarks } from "@/entities/mark";
import { PageHeader } from "@/shared/ui";

function formatHeaderDate(locale: string): string {
  const now = new Date();
  return now.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function TodayPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateStr = useMemo(() => formatHeaderDate(i18n.language), [i18n.language]);
  const { data: pet } = usePet();
  const { data: marks } = useTodayMarks();

  const items = marks?.items ?? [];
  const taken = items.filter((i) => i.status).length;
  const mood = moodForProgress(taken, items.length);

  return (
    <div className="min-h-full" style={{ paddingBottom: "calc(74px + 16px + env(safe-area-inset-bottom))" }}>
      <PageHeader title={t("today.title")} subtitle={dateStr} height={180}>
        {pet && (
          <button
            onClick={() => navigate("/game")}
            aria-label="pet-chip"
            className="flex items-center cursor-pointer"
            style={{
              position: "absolute",
              top: 52,
              right: 20,
              gap: 6,
              padding: "4px 10px 4px 4px",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,.16)",
            }}
          >
            <span
              className="flex items-center justify-center rounded-full bg-white"
              style={{ width: 28, height: 28, fontSize: 16 }}
              aria-hidden="true"
            >
              {stageEmojiForLevel(pet.level)}
            </span>
            <span className="text-[11px] font-medium text-white">{t(`pet.mood.${mood}`)}</span>
          </button>
        )}
        <p className="text-[#A7F3D0] text-[11px] font-semibold tracking-[1.5px] uppercase">
          MedReminder
        </p>
      </PageHeader>
      <div style={{ padding: "16px 16px 0 16px" }}>
        <TodayFeed />
      </div>
    </div>
  );
}
