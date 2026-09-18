import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../routes";

const useCurrentUserMock = vi.fn();

vi.mock("@/pages/today", () => ({ TodayPage: () => <div>today-page</div> }));
vi.mock("@/pages/calendar", () => ({ CalendarPage: () => <div>calendar-page</div> }));
vi.mock("@/pages/medications", () => ({ MedicationsPage: () => <div>medications-page</div> }));
vi.mock("@/pages/habits", () => ({ HabitsPage: () => <div>habits-page</div> }));
vi.mock("@/pages/profile", () => ({ ProfilePage: () => <div>profile-page</div> }));
vi.mock("@/pages/game", () => ({ GamePage: () => <div>game-page</div> }));
vi.mock("@/pages/plans", () => ({ PlansPage: () => <div>plans-page</div> }));
vi.mock("@/pages/admin", () => ({ AdminPage: () => <div>admin-page</div> }));
vi.mock("@/entities/user", () => ({
  useCurrentUser: () => useCurrentUserMock(),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe("AppRoutes", () => {
  beforeEach(() => {
    useCurrentUserMock.mockReturnValue({ data: { is_admin: false }, isPending: false });
  });

  it("redirects /achievements to the game page", () => {
    renderAt("/achievements");
    expect(screen.getByText("game-page")).toBeInTheDocument();
  });

  it("renders the game page directly at /game", () => {
    renderAt("/game");
    expect(screen.getByText("game-page")).toBeInTheDocument();
  });

  it("renders the profile page directly at /profile", () => {
    renderAt("/profile");
    expect(screen.getByText("profile-page")).toBeInTheDocument();
  });

  it("redirects /settings to the profile page", () => {
    renderAt("/settings");
    expect(screen.getByText("profile-page")).toBeInTheDocument();
  });
});

describe("AdminGuard", () => {
  it("renders the admin page for an admin on a direct visit", () => {
    useCurrentUserMock.mockReturnValue({ data: { is_admin: true }, isPending: false });
    renderAt("/admin");
    expect(screen.getByText("admin-page")).toBeInTheDocument();
  });

  it("redirects a non-admin away from /admin", () => {
    useCurrentUserMock.mockReturnValue({ data: { is_admin: false }, isPending: false });
    renderAt("/admin");
    expect(screen.getByText("today-page")).toBeInTheDocument();
  });

  it("waits for the profile instead of redirecting while it is pending", () => {
    useCurrentUserMock.mockReturnValue({ data: undefined, isPending: true });
    renderAt("/admin");
    expect(screen.queryByText("today-page")).not.toBeInTheDocument();
    expect(screen.queryByText("admin-page")).not.toBeInTheDocument();
  });
});
