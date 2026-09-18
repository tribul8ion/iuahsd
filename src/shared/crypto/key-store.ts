const KEY_STORAGE_ID = "mr.crypto.key";

let memoryKey: string | null = null;

const KEY_STORAGE_FALLBACK = "mr.crypto.key.local";

function isUnsupported(error: unknown): boolean {
  return typeof error === "string" && error.toUpperCase().includes("UNSUPPORTED");
}

function legacyRead(): string | null {
  try {
    return window.localStorage.getItem(KEY_STORAGE_FALLBACK);
  } catch {
    return null;
  }
}

function legacyWrite(value: string): void {
  try {
    window.localStorage.setItem(KEY_STORAGE_FALLBACK, value);
  } catch {
    void 0;
  }
}

function legacyClear(): void {
  try {
    window.localStorage.removeItem(KEY_STORAGE_FALLBACK);
  } catch {
    void 0;
  }
}

function getSecureStorage(): TelegramSecureStorage | null {
  if (typeof window === "undefined") {
    return null;
  }
  const webApp = window.Telegram?.WebApp;
  if (!webApp || typeof webApp.isVersionAtLeast !== "function") {
    return null;
  }
  if (!webApp.isVersionAtLeast("9.0")) {
    return null;
  }
  return webApp.SecureStorage ?? null;
}

function secureSetItem(
  storage: TelegramSecureStorage,
  key: string,
  value: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    storage.setItem(key, value, (error) => {
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve();
    });
  });
}

function secureGetItem(
  storage: TelegramSecureStorage,
  key: string
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    storage.getItem(key, (error, value) => {
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve(value);
    });
  });
}

function secureRemoveItem(
  storage: TelegramSecureStorage,
  key: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    storage.removeItem(key, (error) => {
      if (error) {
        reject(new Error(error));
        return;
      }
      resolve();
    });
  });
}

export function storageMode(): "secure" | "memory" {
  return getSecureStorage() !== null ? "secure" : "memory";
}

export async function saveKey(keyB64: string): Promise<void> {
  const storage = getSecureStorage();
  if (storage === null) {
    memoryKey = keyB64;
    legacyWrite(keyB64);
    return;
  }
  try {
    await secureSetItem(storage, KEY_STORAGE_ID, keyB64);
    legacyClear();
  } catch (error) {
    if (isUnsupported(error)) {
      memoryKey = keyB64;
      legacyWrite(keyB64);
      return;
    }
    throw error;
  }
}

export async function loadKey(): Promise<string | null> {
  const storage = getSecureStorage();
  if (storage === null) {
    return memoryKey ?? legacyRead();
  }
  try {
    const value = await secureGetItem(storage, KEY_STORAGE_ID);
    if (value !== null) {
      return value;
    }
    const fallback = legacyRead();
    if (fallback !== null) {
      await saveKey(fallback);
      return fallback;
    }
    return null;
  } catch (error) {
    if (isUnsupported(error)) {
      return memoryKey ?? legacyRead();
    }
    return null;
  }
}

export async function clearKey(): Promise<void> {
  const storage = getSecureStorage();
  if (storage === null) {
    memoryKey = null;
    legacyClear();
    return;
  }
  try {
    await secureRemoveItem(storage, KEY_STORAGE_ID);
  } catch (error) {
    if (!isUnsupported(error)) {
      void 0;
    }
  } finally {
    memoryKey = null;
    legacyClear();
  }
}
