import {
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  levelForXp,
  levelFloorXp,
  nextLevelXpForLevel,
} from "../thresholds";

describe("pet level thresholds", () => {
  it("mirrors the eight-level threshold tuple from the backend contract", () => {
    expect(LEVEL_THRESHOLDS).toEqual([0, 100, 300, 700, 1500, 3000, 6000, 12000]);
    expect(MAX_LEVEL).toBe(8);
  });

  it("maps xp 0 to level 1", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("maps xp just below a threshold to the lower level", () => {
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(299)).toBe(2);
  });

  it("maps xp exactly at a threshold to the new level", () => {
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelForXp(12000)).toBe(8);
  });

  it("caps level at 8 for xp beyond the last threshold", () => {
    expect(levelForXp(999999)).toBe(8);
  });

  it("returns the xp floor for the current level", () => {
    expect(levelFloorXp(1)).toBe(0);
    expect(levelFloorXp(5)).toBe(1500);
    expect(levelFloorXp(8)).toBe(12000);
  });

  it("returns the next level's xp threshold, or null at max level", () => {
    expect(nextLevelXpForLevel(1)).toBe(100);
    expect(nextLevelXpForLevel(7)).toBe(12000);
    expect(nextLevelXpForLevel(8)).toBeNull();
  });
});
