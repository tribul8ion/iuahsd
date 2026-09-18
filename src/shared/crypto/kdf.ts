import { getSodium } from "./sodium";

export const KEY_BYTES = 32;

export interface KdfParams {
  memoryKib: number;
  iterations: number;
  parallelism: number;
}

export const MIN_KDF_PARAMS: KdfParams = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
};

export class WeakKdfParamsError extends Error {
  constructor(message = "kdf_params_too_weak") {
    super(message);
    this.name = "WeakKdfParamsError";
  }
}

export function assertKdfFloor(params: KdfParams): KdfParams {
  if (
    params.memoryKib < MIN_KDF_PARAMS.memoryKib ||
    params.iterations < MIN_KDF_PARAMS.iterations ||
    params.parallelism < MIN_KDF_PARAMS.parallelism
  ) {
    throw new WeakKdfParamsError();
  }
  return params;
}

export async function deriveKey(
  passphrase: string,
  saltB64: string,
  params: KdfParams
): Promise<Uint8Array> {
  assertKdfFloor(params);
  const sodium = await getSodium();
  const salt = sodium.from_base64(saltB64, sodium.base64_variants.ORIGINAL);
  return sodium.crypto_pwhash(
    KEY_BYTES,
    passphrase,
    salt,
    params.iterations,
    params.memoryKib * 1024,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
}
