// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getSodium } from "@/shared/crypto/sodium";
import { makeKcv, verifyKcv } from "@/shared/crypto/kcv";

async function randomKey(): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.randombytes_buf(32);
}

describe("kcv", () => {
  it("verifies true for the key it was created with", async () => {
    const key = await randomKey();
    const kcv = await makeKcv(key);

    await expect(verifyKcv(kcv, key)).resolves.toBe(true);
  });

  it("verifies false for a different key", async () => {
    const key = await randomKey();
    const wrongKey = await randomKey();
    const kcv = await makeKcv(key);

    await expect(verifyKcv(kcv, wrongKey)).resolves.toBe(false);
  });
});
