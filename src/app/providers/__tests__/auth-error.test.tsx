import { render, screen, fireEvent } from "@testing-library/react";
import { postEvent } from "@telegram-apps/sdk-react";
import { AuthErrorScreen } from "../auth-error";

vi.mock("@telegram-apps/sdk-react", () => ({
  postEvent: vi.fn(),
  retrieveLaunchParams: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("AuthErrorScreen", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders the localized title, message and close button", () => {
    render(<AuthErrorScreen />);
    expect(screen.getByText("auth_error.title")).toBeInTheDocument();
    expect(screen.getByText("auth_error.message")).toBeInTheDocument();
    expect(screen.getByText("auth_error.close")).toBeInTheDocument();
  });

  it("closes the mini app on button click", () => {
    render(<AuthErrorScreen />);
    fireEvent.click(screen.getByText("auth_error.close"));
    expect(postEvent).toHaveBeenCalledWith("web_app_close");
  });
});
