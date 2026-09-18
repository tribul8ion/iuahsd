import type { TagKey } from "@/entities/entry";

export type BaseAchievementId =
  | "first_step"
  | "combo_5"
  | "hundred"
  | "iron_will_30"
  | "marathon_365"
  | "early_bird_10"
  | "night_owl_10"
  | "phoenix"
  | "collector_10"
  | "perfect_week";

export const LADDER_DAYS = [7, 30, 100, 365] as const;

export type LadderDays = (typeof LADDER_DAYS)[number];

export type LadderAchievementId = `${TagKey}_${LadderDays}`;

export type AchievementId = BaseAchievementId | LadderAchievementId;

export interface EarnedAchievement {
  achievement_id: AchievementId;
  earned_at: string;
}

export interface AchievementsResponse {
  earned: EarnedAchievement[];
}
