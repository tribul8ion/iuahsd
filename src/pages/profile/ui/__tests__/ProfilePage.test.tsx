import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { ProfilePage } from "../ProfilePage";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import { useUserStore } from "@/entities/user";
import type { User, UserSettings } from "@/entities/user";
import type { Entry } from "@/entities/entry";
import {
  createSuccessResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGetUserFirstName = vi.fn<() => string | null>(() => null);

vi.mock("@/shared/lib", () => ({
  hapticFeedback: vi.fn(),
  getUserFirstName: () => mockGetUserFirstName(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (key === "achievements.counter" && vars) return `${vars.count}/${vars.total}`;
      if (key === "profile.member_since" && vars) return `since ${vars.date}`;
      return key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

const baseSettings: UserSettings = {
  reminders_enabled: true,
  reminder_repeat_minutes: 15,
  muted_today: false,
  language: "en",
  timezone: "Europe/Helsinki",
};

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    telegram_id: 123456789,
    language: "en",
    is_admin: false,
    created_at: "2026-01-15T00:00:00Z",
    last_active: "2026-04-10T00:00:00Z",
    medications_count: 2,
    entries_count: 5,
    crypto_initialized: true,
    current_policy_version: "1.0",
    last_accepted_policy_version: "1.0",
    needs_consent_refresh: false,
    ...overrides,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function mockApi({
  user = buildUser(),
  earnedIds = [],
  entries = mockEntries,
}: {
  user?: User;
  earnedIds?: string[];
  entries?: Entry[];
} = {}) {
  vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
    if (path === "/settings") return createSuccessResponse(baseSettings);
    if (path === "/me") return createSuccessResponse(user);
    if (path === "/achievements") {
      return createSuccessResponse({
        earned: earnedIds.map((id) => ({ achievement_id: id, earned_at: "2026-01-01T00:00:00Z" })),
      });
    }
    if (path === "/entries") {
      const dtos = await Promise.all(entries.map((e) => buildEntryDto(e)));
      return createSuccessResponse({ entries: dtos, count: dtos.length });
    }
    throw new Error(`unexpected path ${path}`);
  });
}

describe("ProfilePage", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    useUserStore.setState({ isAdmin: false, language: "en" });
    mockGetUserFirstName.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the entries, achievements, and streak stats from profile/achievement/entry data", async () => {
    mockApi({
      user: buildUser({ entries_count: 5 }),
      earnedIds: ["first_step", "combo_5", "hundred"],
      entries: [
        { ...mockEntries[0], streak_best: 3 },
        { ...mockEntries[1], streak_best: 12 },
        { ...mockEntries[2], streak_best: 7 },
      ],
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(await screen.findByText("🔥 12")).toBeInTheDocument();
    expect(await screen.findByText("3/42")).toBeInTheDocument();
  });

  it("shows a dash for the best streak when no entry has a streak", async () => {
    mockApi({
      entries: [
        { ...mockEntries[0], streak_best: 0 },
        { ...mockEntries[1], streak_best: 0 },
      ],
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(await screen.findByText("—")).toBeInTheDocument();
  });

  it("shows the Telegram first name when available", async () => {
    mockGetUserFirstName.mockReturnValue("Ксения");
    mockApi();

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(await screen.findByText("Ксения")).toBeInTheDocument();
  });

  it("falls back to profile.you when no Telegram name is available", async () => {
    mockGetUserFirstName.mockReturnValue(null);
    mockApi();

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(await screen.findByText("profile.you")).toBeInTheDocument();
  });

  it("does not render the admin section, even for an admin user", async () => {
    useUserStore.setState({ isAdmin: true });
    mockApi();

    render(<ProfilePage />, { wrapper: createWrapper() });

    await screen.findByText("settings.reminders_settings");
    expect(screen.queryByLabelText("admin-section")).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not render the medications, plans or achievements links (moved to the More menu)", async () => {
    mockApi();

    render(<ProfilePage />, { wrapper: createWrapper() });

    await screen.findByText("settings.reminders_settings");
    expect(screen.queryByText("settings.medications_link")).not.toBeInTheDocument();
    expect(screen.queryByText("settings.plans_link")).not.toBeInTheDocument();
    expect(screen.queryByText("settings.achievements")).not.toBeInTheDocument();
  });

  it("still renders the preserved settings sections", async () => {
    mockApi();

    render(<ProfilePage />, { wrapper: createWrapper() });

    await screen.findByText("settings.reminders_settings");
    expect(screen.getByText("settings.security")).toBeInTheDocument();
    expect(screen.getByText("settings.danger_zone")).toBeInTheDocument();
    expect(screen.getByText("settings.delete_account")).toBeInTheDocument();
  });

  it("toggles reminders via the switch", async () => {
    mockApi();
    vi.mocked(apiClient.patch).mockResolvedValue(
      createSuccessResponse({ ...baseSettings, reminders_enabled: false })
    );

    render(<ProfilePage />, { wrapper: createWrapper() });
    await screen.findByText("settings.reminders_settings");

    fireEvent.click(screen.getByRole("switch"));

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith("/settings", { reminders_enabled: false })
    );
  });
});
