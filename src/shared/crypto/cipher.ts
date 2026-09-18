import { getSodium } from "./sodium";

export class DecryptError extends Error {
  constructor(message = "decrypt_failed") {
    super(message);
    this.name = "DecryptError";
  }
}

export async function encrypt(
  plaintext: Uint8Array | string,
  key: Uint8Array
): Promise<string> {
  const sodium = await getSodium();
  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );
  const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plaintext,
    null,
    null,
    nonce,
    key
  );
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce, 0);
  combined.set(ciphertext, nonce.length);
  return sodium.to_base64(combined, sodium.base64_variants.ORIGINAL);
}

export async function decrypt(
  b64: string,
  key: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium();
  const nonceBytes = sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;

  let combined: Uint8Array;
  try {
    combined = sodium.from_base64(b64, sodium.base64_variants.ORIGINAL);
  } catch {
    throw new DecryptError();
  }

  if (combined.length < nonceBytes) {
    throw new DecryptError();
  }

  const nonce = combined.slice(0, nonceBytes);
  const ciphertext = combined.slice(nonceBytes);

  try {
    return sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null,
      nonce,
      key
    );
  } catch {
    throw new DecryptError();
  }
}
