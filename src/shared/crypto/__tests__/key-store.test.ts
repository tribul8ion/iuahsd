import { afterEach, describe, expect, it } from "vitest";
import {
  clearKey,
  loadKey,
  saveKey,
  storageMode,
} from "@/shared/crypto/key-store";

describe("key-store (memory fallback)", () => {
  afterEach(async () => {
    await clearKey();
  });

  it("reports memory mode when Telegram SecureStorage is unavailable", () => {
    expect(storageMode()).toBe("memory");
  });

  it("saves and loads a key", async () => {
    await saveKey("base64-key-value");

    await expect(loadKey()).resolves.toBe("base64-key-value");
  });

  it("returns null when nothing was saved", async () => {
    await expect(loadKey()).resolves.toBeNull();
  });

  it("clears a saved key", async () => {
    await saveKey("base64-key-value");
    await clearKey();

    await expect(loadKey()).resolves.toBeNull();
  });
});
