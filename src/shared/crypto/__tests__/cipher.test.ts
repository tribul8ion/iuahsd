// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getSodium } from "@/shared/crypto/sodium";
import { DecryptError, decrypt, encrypt } from "@/shared/crypto/cipher";

async function randomKey(): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.randombytes_buf(32);
}

describe("cipher", () => {
  it("decrypts what it encrypted", async () => {
    const key = await randomKey();
    const plaintext = new TextEncoder().encode("hello world");

    const ciphertext = await encrypt(plaintext, key);
    const decrypted = await decrypt(ciphertext, key);

    expect(decrypted).toEqual(plaintext);
  });

  it("produces a different ciphertext each time due to random nonce", async () => {
    const key = await randomKey();
    const plaintext = new TextEncoder().encode("same message");

    const first = await encrypt(plaintext, key);
    const second = await encrypt(plaintext, key);

    expect(first).not.toEqual(second);
  });

  it("throws DecryptError when the key does not match", async () => {
    const key = await randomKey();
    const wrongKey = await randomKey();
    const plaintext = new TextEncoder().encode("secret");

    const ciphertext = await encrypt(plaintext, key);

    await expect(decrypt(ciphertext, wrongKey)).rejects.toThrow(DecryptError);
  });

  it("throws DecryptError when ciphertext bytes are tampered with", async () => {
    const sodium = await getSodium();
    const key = await randomKey();
    const plaintext = new TextEncoder().encode("tamper me");

    const ciphertext = await encrypt(plaintext, key);
    const raw = sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL);
    raw[raw.length - 1] = raw[raw.length - 1] ^ 0xff;
    const tampered = sodium.to_base64(raw, sodium.base64_variants.ORIGINAL);

    await expect(decrypt(tampered, key)).rejects.toThrow(DecryptError);
  });

  it("throws DecryptError for malformed base64 input", async () => {
    const key = await randomKey();

    await expect(decrypt("not-valid-base64!!!", key)).rejects.toThrow(
      DecryptError
    );
  });
});
