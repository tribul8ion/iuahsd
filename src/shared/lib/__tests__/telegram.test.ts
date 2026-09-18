import { hapticFeedback, closeApp, getUserLanguage, getUserFirstName } from "../telegram";
import { postEvent, retrieveLaunchParams } from "@telegram-apps/sdk-react";

vi.mock("@telegram-apps/sdk-react", () => ({
  postEvent: vi.fn(),
  retrieveLaunchParams: vi.fn(),
}));

describe("hapticFeedback", () => {
  afterEach(() => vi.clearAllMocks());

  it("sends impact feedback with default style", () => {
    hapticFeedback("impact");
    expect(postEvent).toHaveBeenCalledWith("web_app_trigger_haptic_feedback", {
      type: "impact",
      impact_style: "light",
    });
  });

  it("sends impact feedback with custom style", () => {
    hapticFeedback("impact", "heavy");
    expect(postEvent).toHaveBeenCalledWith("web_app_trigger_haptic_feedback", {
      type: "impact",
      impact_style: "heavy",
    });
  });

  it("sends notification feedback with default style", () => {
    hapticFeedback("notification");
    expect(postEvent).toHaveBeenCalledWith("web_app_trigger_haptic_feedback", {
      type: "notification",
      notification_type: "success",
    });
  });

  it("sends notification feedback with custom style", () => {
    hapticFeedback("notification", "error");
    expect(postEvent).toHaveBeenCalledWith("web_app_trigger_haptic_feedback", {
      type: "notification",
      notification_type: "error",
    });
  });

  it("sends selection_change feedback", () => {
    hapticFeedback("selection_change");
    expect(postEvent).toHaveBeenCalledWith("web_app_trigger_haptic_feedback", {
      type: "selection_change",
    });
  });

  it("silently catches errors", () => {
    vi.mocked(postEvent).mockImplementation(() => {
      throw new Error("not available");
    });
    expect(() => hapticFeedback("impact")).not.toThrow();
  });
});

describe("closeApp", () => {
  afterEach(() => vi.clearAllMocks());

  it("sends the web_app_close event", () => {
    closeApp();
    expect(postEvent).toHaveBeenCalledWith("web_app_close");
  });

  it("silently catches errors", () => {
    vi.mocked(postEvent).mockImplementation(() => {
      throw new Error("not available");
    });
    expect(() => closeApp()).not.toThrow();
  });
});

describe("getUserLanguage", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns user language from launch params", () => {
    vi.mocked(retrieveLaunchParams).mockReturnValue({
      tgWebAppData: { user: { languageCode: "ru" } },
    } as ReturnType<typeof retrieveLaunchParams>);

    expect(getUserLanguage()).toBe("ru");
  });

  it("returns 'en' when no language code", () => {
    vi.mocked(retrieveLaunchParams).mockReturnValue({
      tgWebAppData: { user: {} },
    } as ReturnType<typeof retrieveLaunchParams>);

    expect(getUserLanguage()).toBe("en");
  });

  it("returns 'en' on error", () => {
    vi.mocked(retrieveLaunchParams).mockImplementation(() => {
      throw new Error("no params");
    });

    expect(getUserLanguage()).toBe("en");
  });
});

describe("getUserFirstName", () => {
  afterEach(() => vi.clearAllMocks());

  it("returns the user's first name from launch params", () => {
    vi.mocked(retrieveLaunchParams).mockReturnValue({
      tgWebAppData: { user: { firstName: "Ксения" } },
    } as ReturnType<typeof retrieveLaunchParams>);

    expect(getUserFirstName()).toBe("Ксения");
  });

  it("returns null when there is no first name", () => {
    vi.mocked(retrieveLaunchParams).mockReturnValue({
      tgWebAppData: { user: {} },
    } as ReturnType<typeof retrieveLaunchParams>);

    expect(getUserFirstName()).toBeNull();
  });

  it("returns null on error", () => {
    vi.mocked(retrieveLaunchParams).mockImplementation(() => {
      throw new Error("no params");
    });

    expect(getUserFirstName()).toBeNull();
  });
});

