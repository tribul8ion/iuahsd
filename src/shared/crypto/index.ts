import type { KdfParams } from "./kdf";

export { getSodium } from "./sodium";
export { makeSalt, SALT_BYTES } from "./random";
export {
  deriveKey,
  KEY_BYTES,
  MIN_KDF_PARAMS,
  WeakKdfParamsError,
  assertKdfFloor,
} from "./kdf";
export type { KdfParams } from "./kdf";
export { encrypt, decrypt, DecryptError } from "./cipher";
export {
  encryptPayload,
  decryptPayload,
  encryptProjectPayload,
  decryptProjectPayload,
  UnsupportedVersionError,
} from "./payload";
export type { EntryPayloadV1, ProjectPayloadV1 } from "./payload";
export { makeKcv, verifyKcv, KCV_PLAINTEXT } from "./kcv";
export { saveKey, loadKey, clearKey, storageMode } from "./key-store";
export { keyToB64, keyFromB64 } from "./encoding";

export const DEFAULT_KDF_PARAMS: KdfParams = {
  memoryKib: 65536,
  iterations: 3,
  parallelism: 1,
};
