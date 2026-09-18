const MAX_PRE_REMIND = 3;

export function togglePreRemind(current: readonly number[], minutes: number): number[] {
  if (current.includes(minutes)) {
    return current.filter((m) => m !== minutes);
  }
  if (current.length >= MAX_PRE_REMIND) {
    return [...current];
  }
  return [...current, minutes].sort((a, b) => a - b);
}
