export interface ProfileStageInput {
  needsConsentRefresh: boolean;
}

export type ProfileStageResult = "consent" | "crypto";

export function nextStateAfterProfile(
  input: ProfileStageInput
): ProfileStageResult {
  return input.needsConsentRefresh ? "consent" : "crypto";
}

export interface CryptoStageInput {
  saltExists: boolean;
  hasKey: boolean;
  kcvValid: boolean;
}

export type CryptoStageResult = "onboarding" | "unlock" | "ready";

export function nextStateAfterSalt(input: CryptoStageInput): CryptoStageResult {
  if (!input.saltExists) {
    return "onboarding";
  }
  if (input.hasKey && input.kcvValid) {
    return "ready";
  }
  return "unlock";
}
