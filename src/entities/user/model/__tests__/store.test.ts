import { useUserStore } from "../store";

describe("useUserStore", () => {
  beforeEach(() => {
    useUserStore.setState({ language: "en", isAdmin: false });
  });

  describe("initial state", () => {
    it("has language set to en", () => {
      const state = useUserStore.getState();
      expect(state.language).toBe("en");
    });

    it("has isAdmin set to false", () => {
      const state = useUserStore.getState();
      expect(state.isAdmin).toBe(false);
    });
  });

  describe("setLanguage", () => {
    it("updates language to ru", () => {
      useUserStore.getState().setLanguage("ru");

      expect(useUserStore.getState().language).toBe("ru");
    });

    it("updates language to uk", () => {
      useUserStore.getState().setLanguage("uk");

      expect(useUserStore.getState().language).toBe("uk");
    });

    it("does not affect isAdmin when changing language", () => {
      useUserStore.setState({ isAdmin: true });
      useUserStore.getState().setLanguage("fr");

      expect(useUserStore.getState().isAdmin).toBe(true);
    });
  });

  describe("setIsAdmin", () => {
    it("updates isAdmin to true", () => {
      useUserStore.getState().setIsAdmin(true);

      expect(useUserStore.getState().isAdmin).toBe(true);
    });

    it("updates isAdmin back to false", () => {
      useUserStore.getState().setIsAdmin(true);
      useUserStore.getState().setIsAdmin(false);

      expect(useUserStore.getState().isAdmin).toBe(false);
    });

    it("does not affect language when changing isAdmin", () => {
      useUserStore.getState().setLanguage("de");
      useUserStore.getState().setIsAdmin(true);

      expect(useUserStore.getState().language).toBe("de");
    });
  });
});
