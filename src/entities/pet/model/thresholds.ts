export const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }
  return level;
}

export function levelFloorXp(level: number): number {
  const index = Math.min(Math.max(level, 1), MAX_LEVEL) - 1;
  return LEVEL_THRESHOLDS[index];
}

export function nextLevelXpForLevel(level: number): number | null {
  if (level >= MAX_LEVEL) {
    return null;
  }
  return LEVEL_THRESHOLDS[level];
}
