import { ACHIEVEMENTS, ladderStagesForTag, ladderDaysFromId } from "../catalog";
import { VALID_TAGS, TAGS } from "@/entities/entry";
import type { AchievementId } from "../types";
import { LADDER_DAYS } from "../types";

const BASE_IDS: AchievementId[] = [
  "first_step",
  "combo_5",
  "hundred",
  "iron_will_30",
  "marathon_365",
  "early_bird_10",
  "night_owl_10",
  "phoenix",
  "collector_10",
  "perfect_week",
];

const LADDER_IDS: AchievementId[] = VALID_TAGS.flatMap((tag) =>
  LADDER_DAYS.map((days) => `${tag}_${days}` as AchievementId)
);

describe("ACHIEVEMENTS catalog", () => {
  it("mirrors the ten Family 1 ids plus the 32 ladder ids", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id).sort();
    const expected = [...BASE_IDS, ...LADDER_IDS].sort();
    expect(ids).toEqual(expected);
    expect(ACHIEVEMENTS).toHaveLength(42);
  });

  it("assigns a unique emoji to every base badge", () => {
    const baseEmojis = ACHIEVEMENTS.filter((a) => BASE_IDS.includes(a.id)).map((a) => a.emoji);
    expect(new Set(baseEmojis).size).toBe(baseEmojis.length);
  });

  it("assigns the tag emoji to every ladder stage of that tag", () => {
    for (const tag of VALID_TAGS) {
      const stages = ladderStagesForTag(tag);
      expect(stages).toHaveLength(4);
      for (const stage of stages) {
        expect(stage.emoji).toBe(TAGS[tag]);
      }
    }
  });

  it("assigns a unique sequential order to every badge", () => {
    const orders = ACHIEVEMENTS.map((a) => a.order).sort((a, b) => a - b);
    expect(orders).toEqual(Array.from({ length: 42 }, (_, i) => i + 1));
  });

  it("derives i18n keys from the achievement id", () => {
    const firstStep = ACHIEVEMENTS.find((a) => a.id === "first_step");
    expect(firstStep?.nameKey).toBe("achievements.badges.first_step.name");
    expect(firstStep?.conditionKey).toBe("achievements.badges.first_step.condition");

    const coffee7 = ACHIEVEMENTS.find((a) => a.id === "coffee_7");
    expect(coffee7?.nameKey).toBe("achievements.badges.coffee_7.name");
  });

  it("groups the four stages of a tag ladder in ascending day order", () => {
    const stages = ladderStagesForTag("coffee");
    expect(stages.map((s) => ladderDaysFromId(s.id))).toEqual([7, 30, 100, 365]);
  });
});
