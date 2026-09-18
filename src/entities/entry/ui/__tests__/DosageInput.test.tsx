import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { DosageInput } from "../DosageInput";
import type { DosageUnit } from "../../model/types";

function Harness() {
  const [amountRaw, setAmountRaw] = useState("");
  const [unit, setUnit] = useState<DosageUnit>("tablet");
  return (
    <DosageInput
      amountRaw={amountRaw}
      onAmountChange={setAmountRaw}
      unit={unit}
      onOpenUnitModal={() => setUnit("ml")}
      amountPlaceholder="Amount"
      unitLabel={(u) => u}
    />
  );
}

describe("DosageInput", () => {
  it("renders the placeholder and current unit label", () => {
    render(<Harness />);
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
    expect(screen.getByLabelText("dosage-unit")).toHaveTextContent("tablet");
  });

  it("filters non-numeric characters from the amount input", () => {
    render(<Harness />);
    const input = screen.getByLabelText("dosage-amount");
    fireEvent.change(input, { target: { value: "1a2b.5" } });
    expect(input).toHaveValue("12.5");
  });

  it("allows a comma as decimal separator to pass through untouched", () => {
    render(<Harness />);
    const input = screen.getByLabelText("dosage-amount");
    fireEvent.change(input, { target: { value: "1,5" } });
    expect(input).toHaveValue("1,5");
  });

  it("truncates the amount to 5 characters", () => {
    render(<Harness />);
    const input = screen.getByLabelText("dosage-amount");
    fireEvent.change(input, { target: { value: "123456789" } });
    expect(input).toHaveValue("12345");
  });

  it("calls onOpenUnitModal when the unit button is clicked", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("dosage-unit"));
    expect(screen.getByLabelText("dosage-unit")).toHaveTextContent("ml");
  });
});
