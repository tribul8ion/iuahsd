import { render, screen, fireEvent } from "@testing-library/react";
import { MonthCard } from "../MonthCard";
import type { MarkRangeItem } from "@/entities/mark";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && typeof vars === "object" && "returnObjects" in vars) {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      }
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const items: MarkRangeItem[] = [
  { date: "2026-04-07", entry_kind: "med", status: true, entry_color: null },
  { date: "2026-04-07", entry_kind: "habit", status: false, entry_color: null },
  { date: "2026-04-10", entry_kind: "task", status: null, entry_color: null },
];

describe("MonthCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 7));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a 42-cell grid", () => {
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    expect(screen.getByLabelText("2026-04-01")).toBeInTheDocument();
    expect(screen.getByLabelText("2026-04-30")).toBeInTheDocument();
  });

  it("marks today's cell with aria-current", () => {
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    expect(screen.getByLabelText("2026-04-07")).toHaveAttribute("aria-current", "date");
    expect(screen.getByLabelText("2026-04-08")).not.toHaveAttribute("aria-current");
  });

  it("marks the selected day distinctly from today", () => {
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-10"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    expect(screen.getByLabelText("2026-04-10")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("2026-04-07")).toHaveAttribute("aria-selected", "false");
  });

  it("calls onSelectDate with the clicked day's ISO date", () => {
    const onSelectDate = vi.fn();
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={onSelectDate}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("2026-04-15"));
    expect(onSelectDate).toHaveBeenCalledWith("2026-04-15");
  });

  it("calls onPrevMonth and onNextMonth from the navigation buttons", () => {
    const onPrevMonth = vi.fn();
    const onNextMonth = vi.fn();
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );
    fireEvent.click(screen.getByLabelText("calendar.prev_month"));
    fireEvent.click(screen.getByLabelText("calendar.next_month"));
    expect(onPrevMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });

  it("keeps navigation buttons enabled by default", () => {
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    expect(screen.getByLabelText("calendar.prev_month")).not.toBeDisabled();
    expect(screen.getByLabelText("calendar.next_month")).not.toBeDisabled();
  });

  it("disables the prev button when canGoPrev is false", () => {
    const onPrevMonth = vi.fn();
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={onPrevMonth}
        onNextMonth={vi.fn()}
        canGoPrev={false}
      />
    );
    const prevButton = screen.getByLabelText("calendar.prev_month");
    expect(prevButton).toBeDisabled();
    fireEvent.click(prevButton);
    expect(onPrevMonth).not.toHaveBeenCalled();
  });

  it("disables the next button when canGoNext is false", () => {
    const onNextMonth = vi.fn();
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={onNextMonth}
        canGoNext={false}
      />
    );
    const nextButton = screen.getByLabelText("calendar.next_month");
    expect(nextButton).toBeDisabled();
    fireEvent.click(nextButton);
    expect(onNextMonth).not.toHaveBeenCalled();
  });

  it("renders a legend entry for every kind", () => {
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    expect(screen.getByText("calendar.legend_med")).toBeInTheDocument();
    expect(screen.getByText("calendar.legend_habit")).toBeInTheDocument();
    expect(screen.getByText("calendar.legend_task")).toBeInTheDocument();
    expect(screen.getByText("calendar.legend_doc")).toBeInTheDocument();
  });

  it("colors the med dot with the entry's color when set", () => {
    const coloredItems: MarkRangeItem[] = [
      { date: "2026-04-07", entry_kind: "med", status: true, entry_color: "blue" },
    ];
    render(
      <MonthCard
        year={2026}
        month={4}
        items={coloredItems}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    expect(screen.getByLabelText("dot-med-2026-04-07")).toHaveStyle({
      backgroundColor: "#3B82F6",
    });
  });

  it("falls back to the type color for the med dot when the entry has no color", () => {
    render(
      <MonthCard
        year={2026}
        month={4}
        items={items}
        selectedDate="2026-04-07"
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );
    expect(screen.getByLabelText("dot-med-2026-04-07")).toHaveStyle({
      backgroundColor: "#059669",
    });
  });
});
