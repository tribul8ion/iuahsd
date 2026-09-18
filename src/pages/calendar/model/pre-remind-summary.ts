export function formatPreRemindSummary(
  minutes: readonly number[] | null | undefined,
  t: (key: string) => string
): string | null {
  if (!minutes || minutes.length === 0) {
    return null;
  }
  const labels = minutes.map((m) => t(`once.pre_phrase_${m}`));
  if (labels.length === 1) {
    return labels[0];
  }
  const and = t("calendar.and");
  if (labels.length === 2) {
    return `${labels[0]} ${and} ${labels[1]}`;
  }
  return `${labels.slice(0, -1).join(", ")} ${and} ${labels[labels.length - 1]}`;
}
