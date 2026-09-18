import { render, screen, fireEvent } from "@testing-library/react";
import { ColorPicker } from "../ColorPicker";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ColorPicker", () => {
  it("renders the none swatch plus all six color swatches", () => {
    render(<ColorPicker value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText("color-none")).toBeInTheDocument();
    for (const key of ["blue", "cyan", "pink", "red", "indigo", "lime"]) {
      expect(screen.getByLabelText(`color-${key}`)).toBeInTheDocument();
    }
  });

  it("marks the none swatch pressed by default", () => {
    render(<ColorPicker value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText("color-none")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("color-blue")).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the matching swatch pressed when a value is selected", () => {
    render(<ColorPicker value="pink" onChange={vi.fn()} />);
    expect(screen.getByLabelText("color-pink")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("color-none")).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the color key when a swatch is clicked", () => {
    const onChange = vi.fn();
    render(<ColorPicker value={null} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("color-lime"));
    expect(onChange).toHaveBeenCalledWith("lime");
  });

  it("calls onChange with null when the none swatch is clicked", () => {
    const onChange = vi.fn();
    render(<ColorPicker value="lime" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("color-none"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("renders the hint text", () => {
    render(<ColorPicker value={null} onChange={vi.fn()} />);
    expect(screen.getByText("med_color.hint")).toBeInTheDocument();
  });
});
