import { describe, expect, it } from "vitest";
import { nextStateAfterProfile, nextStateAfterSalt } from "../boot";

describe("nextStateAfterProfile", () => {
  it("routes to consent when the policy needs to be re-accepted", () => {
    expect(nextStateAfterProfile({ needsConsentRefresh: true })).toBe("consent");
  });

  it("routes to the crypto stage when consent is up to date", () => {
    expect(nextStateAfterProfile({ needsConsentRefresh: false })).toBe("crypto");
  });
});

describe("nextStateAfterSalt", () => {
  it("routes to onboarding when the salt is not initialized", () => {
    expect(
      nextStateAfterSalt({ saltExists: false, hasKey: false, kcvValid: false })
    ).toBe("onboarding");
  });

  it("routes to onboarding even when a stale key is present", () => {
    expect(
      nextStateAfterSalt({ saltExists: false, hasKey: true, kcvValid: true })
    ).toBe("onboarding");
  });

  it("routes to ready when the stored key matches the kcv", () => {
    expect(
      nextStateAfterSalt({ saltExists: true, hasKey: true, kcvValid: true })
    ).toBe("ready");
  });

  it("routes to unlock when the stored key does not verify", () => {
    expect(
      nextStateAfterSalt({ saltExists: true, hasKey: true, kcvValid: false })
    ).toBe("unlock");
  });

  it("routes to unlock when there is no stored key", () => {
    expect(
      nextStateAfterSalt({ saltExists: true, hasKey: false, kcvValid: false })
    ).toBe("unlock");
  });
});
