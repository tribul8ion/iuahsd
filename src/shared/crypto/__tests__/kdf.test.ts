// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deriveKey, KEY_BYTES, type KdfParams } from "@/shared/crypto/kdf";
import { makeSalt } from "@/shared/crypto/random";

const FAST_PARAMS: KdfParams = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
};

describe("deriveKey", () => {
  it("derives a key of the expected length", async () => {
    const salt = await makeSalt();
    const key = await deriveKey("correct-horse-battery", salt, FAST_PARAMS);

    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(KEY_BYTES);
  });

  it("is deterministic for the same passphrase and salt", async () => {
    const salt = await makeSalt();

    const first = await deriveKey("same-passphrase", salt, FAST_PARAMS);
    const second = await deriveKey("same-passphrase", salt, FAST_PARAMS);

    expect(first).toEqual(second);
  });

  it("derives a different key for a different salt", async () => {
    const saltA = await makeSalt();
    const saltB = await makeSalt();

    const keyA = await deriveKey("same-passphrase", saltA, FAST_PARAMS);
    const keyB = await deriveKey("same-passphrase", saltB, FAST_PARAMS);

    expect(keyA).not.toEqual(keyB);
  });

  it("derives a different key for a different passphrase", async () => {
    const salt = await makeSalt();

    const keyA = await deriveKey("passphrase-one", salt, FAST_PARAMS);
    const keyB = await deriveKey("passphrase-two", salt, FAST_PARAMS);

    expect(keyA).not.toEqual(keyB);
  });
});
