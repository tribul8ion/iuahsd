import { decrypt, encrypt } from "./cipher";
import { getSodium } from "./sodium";

export interface EntryPayloadV1 {
  v: 1;
  name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  notes: string | null;
}

export class UnsupportedVersionError extends Error {
  constructor(message = "unsupported_payload_version") {
    super(message);
    this.name = "UnsupportedVersionError";
  }
}

function isEntryPayloadV1(value: unknown): value is EntryPayloadV1 {
  return (
    typeof value === "object" &&
    value !== null &&
    "v" in value &&
    (value as { v: unknown }).v === 1
  );
}

export async function encryptPayload(
  payload: EntryPayloadV1,
  key: Uint8Array
): Promise<string> {
  return encrypt(JSON.stringify(payload), key);
}

export async function decryptPayload(
  b64: string,
  key: Uint8Array
): Promise<EntryPayloadV1> {
  const sodium = await getSodium();
  const bytes = await decrypt(b64, key);
  const parsed: unknown = JSON.parse(sodium.to_string(bytes));
  if (!isEntryPayloadV1(parsed)) {
    throw new UnsupportedVersionError();
  }
  return parsed;
}

export interface ProjectPayloadV1 {
  v: 1;
  name: string;
}

function isProjectPayloadV1(value: unknown): value is ProjectPayloadV1 {
  return (
    typeof value === "object" &&
    value !== null &&
    "v" in value &&
    (value as { v: unknown }).v === 1 &&
    "name" in value &&
    typeof (value as { name: unknown }).name === "string"
  );
}

export async function encryptProjectPayload(
  payload: ProjectPayloadV1,
  key: Uint8Array
): Promise<string> {
  return encrypt(JSON.stringify(payload), key);
}

export async function decryptProjectPayload(
  b64: string,
  key: Uint8Array
): Promise<ProjectPayloadV1> {
  const sodium = await getSodium();
  const bytes = await decrypt(b64, key);
  const parsed: unknown = JSON.parse(sodium.to_string(bytes));
  if (!isProjectPayloadV1(parsed)) {
    throw new UnsupportedVersionError();
  }
  return parsed;
}
