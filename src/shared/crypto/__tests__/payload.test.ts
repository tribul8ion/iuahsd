// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getSodium } from "@/shared/crypto/sodium";
import { encrypt } from "@/shared/crypto/cipher";
import {
  decryptPayload,
  encryptPayload,
  decryptProjectPayload,
  encryptProjectPayload,
  UnsupportedVersionError,
  type EntryPayloadV1,
  type ProjectPayloadV1,
} from "@/shared/crypto/payload";

async function randomKey(): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.randombytes_buf(32);
}

describe("payload", () => {
  it("round-trips a v1 payload", async () => {
    const key = await randomKey();
    const payload: EntryPayloadV1 = {
      v: 1,
      name: "Metformin",
      dose_amount: 500,
      dose_unit: "mg",
      notes: null,
    };

    const encrypted = await encryptPayload(payload, key);
    const decrypted = await decryptPayload(encrypted, key);

    expect(decrypted).toEqual(payload);
  });

  it("rejects a payload whose version is not 1", async () => {
    const key = await randomKey();
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 2, name: "x" }));
    const encrypted = await encrypt(bytes, key);

    await expect(decryptPayload(encrypted, key)).rejects.toThrow(
      UnsupportedVersionError
    );
  });
});

describe("project payload", () => {
  it("round-trips a v1 project payload", async () => {
    const key = await randomKey();
    const payload: ProjectPayloadV1 = { v: 1, name: "Kitchen renovation" };

    const encrypted = await encryptProjectPayload(payload, key);
    const decrypted = await decryptProjectPayload(encrypted, key);

    expect(decrypted).toEqual(payload);
  });

  it("rejects a project payload whose version is not 1", async () => {
    const key = await randomKey();
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 2, name: "x" }));
    const encrypted = await encrypt(bytes, key);

    await expect(decryptProjectPayload(encrypted, key)).rejects.toThrow(
      UnsupportedVersionError
    );
  });

  it("rejects a project payload missing a name", async () => {
    const key = await randomKey();
    const bytes = new TextEncoder().encode(JSON.stringify({ v: 1 }));
    const encrypted = await encrypt(bytes, key);

    await expect(decryptProjectPayload(encrypted, key)).rejects.toThrow(
      UnsupportedVersionError
    );
  });
});
