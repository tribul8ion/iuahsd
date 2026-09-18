export type TagKey =
  | "coffee"
  | "water"
  | "gym"
  | "sleep"
  | "book"
  | "nosmoke"
  | "meditate"
  | "food";

export const TAGS: Record<TagKey, string> = {
  coffee: "☕",
  water: "💧",
  gym: "🏋️",
  sleep: "😴",
  book: "📖",
  nosmoke: "🚭",
  meditate: "🧘",
  food: "🥗",
};

export const VALID_TAGS: readonly TagKey[] = [
  "coffee",
  "water",
  "gym",
  "sleep",
  "book",
  "nosmoke",
  "meditate",
  "food",
];

export const NO_TAG_EMOJI = "🔒";

export function isTagKey(value: string | null): value is TagKey {
  return value !== null && (VALID_TAGS as readonly string[]).includes(value);
}

export function tagEmoji(tag: string | null): string {
  return isTagKey(tag) ? TAGS[tag] : NO_TAG_EMOJI;
}
