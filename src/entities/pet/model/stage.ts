export type PetStage = "sprout" | "leaf" | "pot" | "blossom" | "tree";

const STAGE_EMOJI: Record<PetStage, string> = {
  sprout: "🌱",
  leaf: "🌿",
  pot: "🪴",
  blossom: "🌸",
  tree: "🌳",
};

export function stageForLevel(level: number): PetStage {
  if (level <= 2) return "sprout";
  if (level <= 4) return "leaf";
  if (level <= 6) return "pot";
  if (level === 7) return "blossom";
  return "tree";
}

export function stageEmojiForLevel(level: number): string {
  return STAGE_EMOJI[stageForLevel(level)];
}
