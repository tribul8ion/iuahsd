export type ColorKey = "blue" | "cyan" | "pink" | "red" | "indigo" | "lime";

export const ENTRY_COLORS: Record<ColorKey, string> = {
  blue: "#3B82F6",
  cyan: "#06B6D4",
  pink: "#EC4899",
  red: "#EF4444",
  indigo: "#6366F1",
  lime: "#84CC16",
};

export const VALID_COLORS: readonly ColorKey[] = [
  "blue",
  "cyan",
  "pink",
  "red",
  "indigo",
  "lime",
];

export function isColorKey(value: string | null): value is ColorKey {
  return value !== null && (VALID_COLORS as readonly string[]).includes(value);
}

export function colorHex(color: string | null): string | null {
  return isColorKey(color) ? ENTRY_COLORS[color] : null;
}
