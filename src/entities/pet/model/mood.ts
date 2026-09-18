export type PetMood = "waiting" | "encouraged" | "blooming";

export function moodForProgress(taken: number, total: number): PetMood {
  if (total <= 0) {
    return "waiting";
  }
  if (taken >= total) {
    return "blooming";
  }
  if (taken * 3 < total) {
    return "waiting";
  }
  return "encouraged";
}
