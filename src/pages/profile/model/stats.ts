import type { Entry } from "@/entities/entry";

const RU_GENITIVE_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
] as const;

export function formatMemberSinceDate(
  createdAt: string | null,
  language: string
): string | null {
  if (!createdAt) return null;

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;

  if (language === "ru") {
    return `${RU_GENITIVE_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function computeBestStreak(entries: readonly Entry[] | undefined): number {
  if (!entries || entries.length === 0) return 0;
  return entries.reduce((max, entry) => Math.max(max, entry.streak_best), 0);
}
