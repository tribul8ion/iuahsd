import { render, screen, fireEvent } from "@testing-library/react";
import { PreRemindChips } from "../PreRemindChips";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PreRemindChips", () => {
  it("renders a chip for every pre-remind option", () => {
    render(<PreRemindChips selected={[]} onToggle={vi.fn()} />);
    for (const minutes of [30, 60, 180, 720, 1440, 2880]) {
      expect(screen.getByLabelText(`pre-remind-${minutes}`)).toBeInTheDocument();
    }
  });

  it("marks selected chips as pressed", () => {
    render(<PreRemindChips selected={[1440]} onToggle={vi.fn()} />);
    expect(screen.getByLabelText("pre-remind-1440")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("pre-remind-180")).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onToggle with the clicked minute value", () => {
    const onToggle = vi.fn();
    render(<PreRemindChips selected={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByLabelText("pre-remind-60"));
    expect(onToggle).toHaveBeenCalledWith(60);
  });

  it("disables unselected chips once three are selected", () => {
    render(<PreRemindChips selected={[30, 60, 180]} onToggle={vi.fn()} />);
    expect(screen.getByLabelText("pre-remind-720")).toBeDisabled();
    expect(screen.getByLabelText("pre-remind-30")).not.toBeDisabled();
  });
});
