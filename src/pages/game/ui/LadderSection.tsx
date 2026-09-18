import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ladderStagesForTag,
  ladderDaysFromId,
  computeLadderProgress,
  useAchievements,
} from "@/entities/achievement";
import type { AchievementId } from "@/entities/achievement";
import { useEntries, VALID_TAGS } from "@/entities/entry";
import type { TagKey } from "@/entities/entry";

interface LadderCardProps {
  tag: TagKey;
  currentValue: number;
  earnedIds: ReadonlySet<AchievementId>;
}

function LadderCard({ tag, currentValue, earnedIds }: LadderCardProps) {
  const { t } = useTranslation();
  const stages = ladderStagesForTag(tag);
  const progress = computeLadderProgress(stages, earnedIds, currentValue);

  return (
    <div
      className="rounded-2xl bg-white"
      style={{ padding: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
      data-testid={`ladder-${tag}`}
    >
      <p className="text-[14px] font-semibold" style={{ color: "#1C1917", marginBottom: 10 }}>
        {stages[0]?.emoji} {t(`tags.${tag}`)}
      </p>

      <div className="flex" style={{ gap: 8 }}>
        {stages.map((stage) => {
          const got = earnedIds.has(stage.id);
          const days = ladderDaysFromId(stage.id);
          return (
            <div
              key={stage.id}
              className="flex-1 flex flex-col items-center rounded-xl text-center"
              style={{
                padding: "10px 4px",
                backgroundColor: got ? "#FBF3E7" : "#F5F5F4",
                color: got ? "#C77414" : "#A8A29E",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{stage.emoji}</span>
              <span className="text-[10px] font-semibold mt-1 leading-tight">{t(stage.nameKey)}</span>
              <span className="text-[10px]">{days}</span>
            </div>
          );
        })}
      </div>

      <p className="text-[12px] mt-2" style={{ color: "#A8A29E" }}>
        {progress.complete
          ? t("game.ladder_complete")
          : t("game.ladder_progress", {
              current: progress.currentValue,
              target: progress.nextStageDays,
              name: t(stages.find((s) => s.id === progress.nextStageId)?.nameKey ?? ""),
              remaining: progress.remainingDays,
            })}
      </p>
    </div>
  );
}

export function LadderSection() {
  const { data: entries } = useEntries();
  const { data: earned } = useAchievements();

  const earnedIds = useMemo(
    () => new Set((earned ?? []).map((e) => e.achievement_id)),
    [earned]
  );

  const habits = useMemo(
    () => (entries ?? []).filter((e) => e.kind === "habit" && e.tag),
    [entries]
  );

  const tagsPresent = useMemo(
    () => VALID_TAGS.filter((tag) => habits.some((h) => h.tag === tag)),
    [habits]
  );

  if (tagsPresent.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col" style={{ gap: 12, marginTop: 12 }}>
      {tagsPresent.map((tag) => {
        const tagHabits = habits.filter((h) => h.tag === tag);
        const currentValue = Math.max(
          0,
          ...tagHabits.map((h) => Math.max(h.streak_current, h.streak_best))
        );
        return (
          <LadderCard key={tag} tag={tag} currentValue={currentValue} earnedIds={earnedIds} />
        );
      })}
    </div>
  );
}
