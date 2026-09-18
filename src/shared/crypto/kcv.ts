import { decrypt, DecryptError, encrypt } from "./cipher";
import { getSodium } from "./sodium";

export const KCV_PLAINTEXT = "kcv:v1";

export async function makeKcv(key: Uint8Array): Promise<string> {
  return encrypt(KCV_PLAINTEXT, key);
}

export async function verifyKcv(
  kcvB64: string,
  key: Uint8Array
): Promise<boolean> {
  try {
    const sodium = await getSodium();
    const bytes = await decrypt(kcvB64, key);
    return sodium.to_string(bytes) === KCV_PLAINTEXT;
  } catch (error) {
    if (error instanceof DecryptError) {
      return false;
    }
    throw error;
  }
}
