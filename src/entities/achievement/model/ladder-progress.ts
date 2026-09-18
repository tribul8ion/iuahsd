import { ladderDaysFromId } from "./catalog";
import type { AchievementCatalogEntry } from "./catalog";
import type { AchievementId } from "./types";

export interface LadderProgress {
  currentValue: number;
  nextStageId: AchievementId | null;
  nextStageDays: number | null;
  remainingDays: number;
  complete: boolean;
}

export function computeLadderProgress(
  stages: readonly AchievementCatalogEntry[],
  earnedIds: ReadonlySet<AchievementId>,
  currentValue: number
): LadderProgress {
  const nextStage = stages.find((stage) => !earnedIds.has(stage.id));

  if (!nextStage) {
    return {
      currentValue,
      nextStageId: null,
      nextStageDays: null,
      remainingDays: 0,
      complete: true,
    };
  }

  const days = ladderDaysFromId(nextStage.id);
  return {
    currentValue: Math.min(currentValue, days),
    nextStageId: nextStage.id,
    nextStageDays: days,
    remainingDays: Math.max(days - currentValue, 0),
    complete: false,
  };
}
