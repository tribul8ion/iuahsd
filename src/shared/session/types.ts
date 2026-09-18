export interface CryptoSettingsDto {
  salt: string;
  kdf_algorithm: string;
  kdf_memory_kib: number;
  kdf_iterations: number;
  kdf_parallelism: number;
  kcv: string;
}

export const CRYPTO_NOT_INITIALIZED = "crypto_not_initialized";
