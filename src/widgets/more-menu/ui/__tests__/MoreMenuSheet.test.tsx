import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MoreMenuSheet } from "../MoreMenuSheet";
import { useUserStore } from "@/entities/user";

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

describe("MoreMenuSheet", () => {
  beforeEach(() => {
    useUserStore.setState({ isAdmin: false });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderSheet(onClose = vi.fn()) {
    render(<MoreMenuSheet isOpen={true} onClose={onClose} />, { wrapper: MemoryRouter });
    return { onClose };
  }

  it("shows four rows for a regular user", () => {
    renderSheet();
    expect(screen.getByText("nav.profile")).toBeInTheDocument();
    expect(screen.getByText("settings.medications_link")).toBeInTheDocument();
    expect(screen.getByText("settings.plans_link")).toBeInTheDocument();
    expect(screen.getByText("settings.achievements")).toBeInTheDocument();
    expect(screen.queryByText("settings.admin_link")).not.toBeInTheDocument();
  });

  it("shows five rows, including admin, for an admin user", () => {
    useUserStore.setState({ isAdmin: true });
    renderSheet();
    expect(screen.getByText("nav.profile")).toBeInTheDocument();
    expect(screen.getByText("settings.medications_link")).toBeInTheDocument();
    expect(screen.getByText("settings.plans_link")).toBeInTheDocument();
    expect(screen.getByText("settings.achievements")).toBeInTheDocument();
    expect(screen.getByText("settings.admin_link")).toBeInTheDocument();
  });

  it("navigates to profile and closes the sheet on tap", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByText("nav.profile"));
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to medications and closes the sheet on tap", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByText("settings.medications_link"));
    expect(mockNavigate).toHaveBeenCalledWith("/medications");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to plans and closes the sheet on tap", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByText("settings.plans_link"));
    expect(mockNavigate).toHaveBeenCalledWith("/plans");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to achievements and closes the sheet on tap", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByText("settings.achievements"));
    expect(mockNavigate).toHaveBeenCalledWith("/game");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("navigates to admin and closes the sheet on tap for an admin user", () => {
    useUserStore.setState({ isAdmin: true });
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByText("settings.admin_link"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is tapped", () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByLabelText("close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    render(<MoreMenuSheet isOpen={false} onClose={vi.fn()} />, { wrapper: MemoryRouter });
    expect(screen.queryByText("more.title")).not.toBeInTheDocument();
  });
});
