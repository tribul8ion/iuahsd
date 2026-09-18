import { getSodium } from "./sodium";

export async function keyToB64(key: Uint8Array): Promise<string> {
  const sodium = await getSodium();
  return sodium.to_base64(key, sodium.base64_variants.ORIGINAL);
}

export async function keyFromB64(b64: string): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.from_base64(b64, sodium.base64_variants.ORIGINAL);
}
