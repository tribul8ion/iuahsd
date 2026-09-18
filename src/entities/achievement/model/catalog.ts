import { VALID_TAGS, TAGS } from "@/entities/entry";
import type { TagKey } from "@/entities/entry";
import { LADDER_DAYS } from "./types";
import type { AchievementId, LadderAchievementId } from "./types";

export interface AchievementCatalogEntry {
  id: AchievementId;
  emoji: string;
  order: number;
  nameKey: string;
  conditionKey: string;
}

function badgeEntry(id: AchievementId, emoji: string, order: number): AchievementCatalogEntry {
  return {
    id,
    emoji,
    order,
    nameKey: `achievements.badges.${id}.name`,
    conditionKey: `achievements.badges.${id}.condition`,
  };
}

function ladderEntries(startOrder: number): AchievementCatalogEntry[] {
  const entries: AchievementCatalogEntry[] = [];
  let order = startOrder;
  for (const tag of VALID_TAGS) {
    for (const days of LADDER_DAYS) {
      const id: LadderAchievementId = `${tag}_${days}`;
      entries.push(badgeEntry(id, TAGS[tag], order));
      order += 1;
    }
  }
  return entries;
}

export const ACHIEVEMENTS: readonly AchievementCatalogEntry[] = [
  badgeEntry("first_step", "🌱", 1),
  badgeEntry("combo_5", "⚡", 2),
  badgeEntry("hundred", "💯", 3),
  badgeEntry("iron_will_30", "🔥", 4),
  badgeEntry("marathon_365", "🏃", 5),
  badgeEntry("early_bird_10", "🐣", 6),
  badgeEntry("night_owl_10", "🌙", 7),
  badgeEntry("phoenix", "🦅", 8),
  badgeEntry("collector_10", "🧲", 9),
  badgeEntry("perfect_week", "📅", 10),
  ...ladderEntries(11),
];

export function ladderStagesForTag(tag: TagKey): AchievementCatalogEntry[] {
  const prefix = `${tag}_`;
  return ACHIEVEMENTS.filter((a) => a.id.startsWith(prefix)).slice().sort((a, b) => a.order - b.order);
}

export function ladderDaysFromId(id: AchievementId): number {
  const parts = id.split("_");
  return Number(parts[parts.length - 1]);
}
