import { computeLadderProgress } from "../ladder-progress";
import { ladderStagesForTag } from "../catalog";
import type { AchievementId } from "../types";

const coffeeStages = ladderStagesForTag("coffee");

describe("computeLadderProgress", () => {
  it("targets the first stage when nothing is earned yet", () => {
    const progress = computeLadderProgress(coffeeStages, new Set(), 3);
    expect(progress).toEqual({
      currentValue: 3,
      nextStageId: "coffee_7",
      nextStageDays: 7,
      remainingDays: 4,
      complete: false,
    });
  });

  it("targets the next unearned stage once earlier stages are earned", () => {
    const earned = new Set<AchievementId>(["coffee_7"]);
    const progress = computeLadderProgress(coffeeStages, earned, 21);
    expect(progress).toEqual({
      currentValue: 21,
      nextStageId: "coffee_30",
      nextStageDays: 30,
      remainingDays: 9,
      complete: false,
    });
  });

  it("caps currentValue and zeroes remainingDays once the target is reached", () => {
    const progress = computeLadderProgress(coffeeStages, new Set(), 400);
    expect(progress.nextStageId).toBe("coffee_7");
    expect(progress.currentValue).toBe(7);
    expect(progress.remainingDays).toBe(0);
  });

  it("reports complete when every stage is earned", () => {
    const earned = new Set<AchievementId>(["coffee_7", "coffee_30", "coffee_100", "coffee_365"]);
    const progress = computeLadderProgress(coffeeStages, earned, 400);
    expect(progress).toEqual({
      currentValue: 400,
      nextStageId: null,
      nextStageDays: null,
      remainingDays: 0,
      complete: true,
    });
  });
});
