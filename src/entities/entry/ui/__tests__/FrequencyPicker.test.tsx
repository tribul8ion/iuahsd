import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { FrequencyPicker } from "../FrequencyPicker";
import type { FrequencyType } from "../../model/types";

const LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  interval: "Interval",
  every: "Every",
  daysSuffix: "days",
};

function Harness({
  showWeekly = false,
  intervalMax = 30,
  initialValue = "daily",
}: {
  showWeekly?: boolean;
  intervalMax?: number;
  initialValue?: FrequencyType;
}) {
  const [value, setValue] = useState<FrequencyType>(initialValue);
  const [daysOfWeek, setDaysOfWeek] = useState(0);
  const [intervalDays, setIntervalDays] = useState(7);

  return (
    <FrequencyPicker
      value={value}
      onChange={setValue}
      labels={LABELS}
      showWeekly={showWeekly}
      daysOfWeek={daysOfWeek}
      onToggleDay={(dayIndex) => setDaysOfWeek((prev) => prev ^ (1 << dayIndex))}
      dayLabels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
      intervalDays={intervalDays}
      onIntervalDaysChange={setIntervalDays}
      intervalMax={intervalMax}
    />
  );
}

describe("FrequencyPicker", () => {
  it("hides weekly tab when showWeekly is false", () => {
    render(<Harness />);
    expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
  });

  it("shows weekly tab and weekday chips when showWeekly is true", () => {
    render(<Harness showWeekly />);
    fireEvent.click(screen.getByText("Weekly"));
    expect(screen.getByLabelText("day-0")).toBeInTheDocument();
  });

  it("builds the correct bitmask from selected weekday chips", () => {
    render(<Harness showWeekly />);
    fireEvent.click(screen.getByText("Weekly"));
    fireEvent.click(screen.getByLabelText("day-0"));
    fireEvent.click(screen.getByLabelText("day-2"));
    fireEvent.click(screen.getByLabelText("day-4"));
    expect(screen.getByLabelText("day-0")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("day-2")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("day-4")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("day-1")).toHaveAttribute("aria-pressed", "false");
  });

  it("toggling a selected day off removes it from the mask", () => {
    render(<Harness showWeekly />);
    fireEvent.click(screen.getByText("Weekly"));
    fireEvent.click(screen.getByLabelText("day-0"));
    fireEvent.click(screen.getByLabelText("day-0"));
    expect(screen.getByLabelText("day-0")).toHaveAttribute("aria-pressed", "false");
  });

  it("normalizes interval to the default when switching to interval", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Interval"));
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("7");
  });

  it("clamps interval increments at intervalMax", () => {
    render(<Harness intervalMax={10} />);
    fireEvent.click(screen.getByText("Interval"));
    const inc = screen.getByLabelText("interval-increment");
    for (let i = 0; i < 10; i++) fireEvent.click(inc);
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("10");
    expect(inc).toBeDisabled();
  });

  it("clamps interval decrements at the minimum of 2", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Interval"));
    const dec = screen.getByLabelText("interval-decrement");
    for (let i = 0; i < 10; i++) fireEvent.click(dec);
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("2");
    expect(dec).toBeDisabled();
  });

  it("shows the validation message when provided", () => {
    render(
      <FrequencyPicker
        value="weekly"
        onChange={vi.fn()}
        labels={LABELS}
        showWeekly
        intervalDays={7}
        onIntervalDaysChange={vi.fn()}
        intervalMax={30}
        validationMessage="Pick a day"
      />
    );
    expect(screen.getByText("Pick a day")).toBeInTheDocument();
  });

  it("renders the start date row only when startDate prop is provided", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Interval"));
    expect(screen.queryByLabelText("start-date")).not.toBeInTheDocument();
  });

  it("shows the start date input when startDate prop is provided", () => {
    function WithStartDate() {
      const [value, setValue] = useState<FrequencyType>("daily");
      const [intervalDays, setIntervalDays] = useState(7);
      const [date, setDate] = useState("2026-07-13");
      return (
        <FrequencyPicker
          value={value}
          onChange={setValue}
          labels={LABELS}
          intervalDays={intervalDays}
          onIntervalDaysChange={setIntervalDays}
          intervalMax={30}
          startDate={{ label: "Start", value: date, onChange: setDate }}
        />
      );
    }
    render(<WithStartDate />);
    fireEvent.click(screen.getByText("Interval"));
    expect(screen.getByLabelText("start-date")).toHaveValue("2026-07-13");
  });
});
