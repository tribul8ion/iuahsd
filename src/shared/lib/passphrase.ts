export const MIN_PASSPHRASE_LENGTH = 12;
export const LONG_PASSPHRASE_LENGTH = 16;
export const MIN_CHARACTER_CLASSES = 3;

export type PassphraseVerdict = "ok" | "too_short" | "too_weak";

const CLASS_PATTERNS = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];

function characterClasses(value: string): number {
  return CLASS_PATTERNS.filter((pattern) => pattern.test(value)).length;
}

function isRepetitive(value: string): boolean {
  return new Set(value).size <= 2;
}

export function checkPassphrase(value: string): PassphraseVerdict {
  if (value.length < MIN_PASSPHRASE_LENGTH) {
    return "too_short";
  }
  if (isRepetitive(value)) {
    return "too_weak";
  }
  if (value.length >= LONG_PASSPHRASE_LENGTH) {
    return "ok";
  }
  return characterClasses(value) >= MIN_CHARACTER_CLASSES ? "ok" : "too_weak";
}
