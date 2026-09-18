import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BottomNav } from "../BottomNav";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("BottomNav", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderNav({
    onAdd = vi.fn(),
    onMore = vi.fn(),
    path = "/",
  }: { onAdd?: () => void; onMore?: () => void; path?: string } = {}) {
    render(
      <MemoryRouter initialEntries={[path]}>
        <BottomNav onAdd={onAdd} onMore={onMore} />
      </MemoryRouter>
    );
    return { onAdd, onMore };
  }

  it("renders exactly five interactive positions: three nav links, the FAB and the more button", () => {
    renderNav();
    expect(screen.getByLabelText("nav.today")).toBeInTheDocument();
    expect(screen.getByLabelText("nav.calendar")).toBeInTheDocument();
    expect(screen.getByLabelText("nav.habits")).toBeInTheDocument();
    expect(screen.getByLabelText("nav.more")).toBeInTheDocument();
    expect(screen.getByLabelText("add-entry")).toBeInTheDocument();
  });

  it("does not render a dedicated profile tab", () => {
    renderNav();
    expect(screen.queryByLabelText("nav.profile")).not.toBeInTheDocument();
  });

  it("does not render an admin tab", () => {
    renderNav();
    expect(screen.queryByLabelText("nav.admin")).not.toBeInTheDocument();
  });

  it("navigates to the matching route when a nav item is clicked", () => {
    renderNav();
    fireEvent.click(screen.getByLabelText("nav.habits"));
    expect(mockNavigate).toHaveBeenCalledWith("/habits");
  });

  it("navigates to the calendar route when the calendar item is clicked", () => {
    renderNav();
    fireEvent.click(screen.getByLabelText("nav.calendar"));
    expect(mockNavigate).toHaveBeenCalledWith("/calendar");
  });

  it("calls onAdd when the FAB is clicked, without navigating", () => {
    const { onAdd } = renderNav();
    fireEvent.click(screen.getByLabelText("add-entry"));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("calls onMore when the more item is clicked, without navigating", () => {
    const { onMore } = renderNav();
    fireEvent.click(screen.getByLabelText("nav.more"));
    expect(onMore).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("marks the current route as active", () => {
    renderNav({ path: "/" });
    expect(screen.getByLabelText("nav.today")).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("nav.calendar")).not.toHaveAttribute("aria-current");
    expect(screen.getByLabelText("nav.more")).not.toHaveAttribute("aria-current");
  });

  it.each(["/profile", "/medications", "/plans", "/game", "/admin"])(
    "marks the more item as active on %s",
    (path) => {
      renderNav({ path });
      expect(screen.getByLabelText("nav.more")).toHaveAttribute("aria-current", "page");
    }
  );

  it("does not mark the more item as active on unrelated routes", () => {
    renderNav({ path: "/habits" });
    expect(screen.getByLabelText("nav.more")).not.toHaveAttribute("aria-current");
    expect(screen.getByLabelText("nav.habits")).toHaveAttribute("aria-current", "page");
  });
});
