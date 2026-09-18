import { getSodium } from "./sodium";

export const SALT_BYTES = 16;

export async function makeSalt(): Promise<string> {
  const sodium = await getSodium();
  const bytes = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(bytes);
  return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL);
}
