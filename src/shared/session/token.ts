const STORAGE_KEY = "med.session";

export interface StoredSession {
  token: string;
  telegramId: number | null;
}

export function loadSessionToken(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.token !== "string" || parsed.token.length === 0) {
      return null;
    }
    return {
      token: parsed.token,
      telegramId: typeof parsed.telegramId === "number" ? parsed.telegramId : null,
    };
  } catch {
    return null;
  }
}

export function saveSessionToken(session: StoredSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    void 0;
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
}
