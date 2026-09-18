import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from "../token";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("session token store", () => {
  it("returns null when nothing is stored", () => {
    expect(loadSessionToken()).toBeNull();
  });

  it("saves and loads a session", () => {
    saveSessionToken({ token: "abc", telegramId: 42 });

    expect(loadSessionToken()).toEqual({ token: "abc", telegramId: 42 });
  });

  it("preserves a null telegram id", () => {
    saveSessionToken({ token: "abc", telegramId: null });

    expect(loadSessionToken()).toEqual({ token: "abc", telegramId: null });
  });

  it("clears a stored session", () => {
    saveSessionToken({ token: "abc", telegramId: 42 });
    clearSessionToken();

    expect(loadSessionToken()).toBeNull();
  });

  it("returns null for malformed json", () => {
    localStorage.setItem("med.session", "{not json");

    expect(loadSessionToken()).toBeNull();
  });

  it("returns null when the stored token is missing", () => {
    localStorage.setItem("med.session", JSON.stringify({ telegramId: 42 }));

    expect(loadSessionToken()).toBeNull();
  });

  it("normalizes a non-numeric telegram id to null", () => {
    localStorage.setItem(
      "med.session",
      JSON.stringify({ token: "abc", telegramId: "42" })
    );

    expect(loadSessionToken()).toEqual({ token: "abc", telegramId: null });
  });

  it("returns null without throwing when reading throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadSessionToken()).toBeNull();
  });

  it("does not throw when writing throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() =>
      saveSessionToken({ token: "abc", telegramId: 42 })
    ).not.toThrow();
  });

  it("does not throw when removing throws", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => clearSessionToken()).not.toThrow();
  });
});
