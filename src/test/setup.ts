import "@testing-library/jest-dom/vitest";

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

vi.mock("@telegram-apps/sdk-react", () => ({
  retrieveRawInitData: () => "test_init_data",
  retrieveLaunchParams: () => ({
    initDataRaw: "test_init_data",
    initData: {
      user: {
        id: 123456789,
        languageCode: "en",
      },
    },
  }),
  postEvent: vi.fn(),
  useSignal: (signal: unknown) => signal,
  SDKProvider: ({ children }: { children: React.ReactNode }) => children,
  useLaunchParams: () => ({
    initDataRaw: "test_init_data",
    initData: { user: { id: 123456789 } },
  }),
  useHapticFeedback: () => ({
    impactOccurred: vi.fn(),
    notificationOccurred: vi.fn(),
  }),
  useMainButton: () => ({
    setText: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    showProgress: vi.fn(),
    hideProgress: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
  useBackButton: () => ({
    show: vi.fn(),
    hide: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

beforeEach(async () => {
  const { useSessionStore } = await import("@/shared/session");
  useSessionStore.setState({ cryptoKey: null, bootState: "boot" });
});
