import { render, screen, fireEvent } from "@testing-library/react";
import { MedicationCard } from "../MedicationCard";
import type { Entry } from "../../model/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && "n" in vars) return `every ${vars.n} d`;
      const fragments = key.split(".");
      return fragments[fragments.length - 1];
    },
  }),
}));

const baseMed: Entry = {
  id: 1,
  kind: "med",
  name: "Aspirin",
  doseAmount: null,
  doseUnit: null,
  notes: null,
  schedule: "morning",
  time: "08:00",
  frequency_type: "daily",
  interval_days: null,
  days_of_week: null,
  date_once: null,
  tag: null,
  color: null,
  start_date: null,
  active: true,
  notifications_enabled: true,
  muted_today: false,
  streak_current: 0,
  streak_best: 0,
  next_run_at: null,
  last_sent_at: null,
  created_at: "2026-01-01T00:00:00Z",
  pre_remind: null,
  project_id: null,
  done: null,
  corrupted: false,
};

describe("MedicationCard", () => {
  it("renders schedule and time without extras when daily and no dosage", () => {
    render(<MedicationCard medication={baseMed} />);
    expect(screen.getByText("Aspirin")).toBeInTheDocument();
    const line = screen.getByText(/morning/);
    expect(line.textContent).toContain("08:00");
    expect(line.textContent).not.toContain("every");
    expect(line.textContent).not.toContain("tablet");
  });

  it("appends interval label when frequency is interval", () => {
    render(
      <MedicationCard
        medication={{ ...baseMed, frequency_type: "interval", interval_days: 7 }}
      />
    );
    const line = screen.getByText(/morning/);
    expect(line.textContent).toContain("every 7 d");
  });

  it("appends dosage amount and unit when present", () => {
    render(
      <MedicationCard
        medication={{ ...baseMed, doseAmount: 2, doseUnit: "ml" }}
      />
    );
    const line = screen.getByText(/morning/);
    expect(line.textContent).toContain("2 ml");
  });

  it("appends both interval and dosage when both present", () => {
    render(
      <MedicationCard
        medication={{
          ...baseMed,
          frequency_type: "interval",
          interval_days: 5,
          doseAmount: 1,
          doseUnit: "tablet",
        }}
      />
    );
    const line = screen.getByText(/morning/);
    expect(line.textContent).toContain("every 5 d");
    expect(line.textContent).toContain("1 tablet");
  });

  it("renders decimal dosage amount", () => {
    render(
      <MedicationCard
        medication={{ ...baseMed, doseAmount: 1.5, doseUnit: "mg" }}
      />
    );
    const line = screen.getByText(/morning/);
    expect(line.textContent).toContain("1.5 mg");
  });

  it("shows a placeholder instead of the name for corrupted entries", () => {
    render(
      <MedicationCard medication={{ ...baseMed, name: "", corrupted: true }} />
    );
    expect(screen.getByText("corrupted_entry")).toBeInTheDocument();
  });

  it("does not show a color indicator when the medication has no color", () => {
    render(<MedicationCard medication={baseMed} />);
    expect(screen.queryByLabelText("medication-color")).not.toBeInTheDocument();
  });

  it("shows a color indicator with the medication's hex when a color is set", () => {
    render(<MedicationCard medication={{ ...baseMed, color: "cyan" }} />);
    expect(screen.getByLabelText("medication-color")).toHaveStyle({
      backgroundColor: "#06B6D4",
    });
  });

  it("picks the icon tile color from the time, not the schedule preset", () => {
    const { container } = render(
      <MedicationCard medication={{ ...baseMed, schedule: "custom", time: "13:00" }} />
    );
    expect(container.querySelector(".w-12")).toHaveStyle({ backgroundColor: "#FFEDD5" });
  });

  it("uses the evening icon tile color for a time after 18:00 regardless of schedule", () => {
    const { container } = render(
      <MedicationCard medication={{ ...baseMed, schedule: "morning", time: "19:30" }} />
    );
    expect(container.querySelector(".w-12")).toHaveStyle({ backgroundColor: "#EDE9FE" });
  });

  it("shows the bell as on when notifications are enabled and not muted today", () => {
    const { container } = render(
      <MedicationCard medication={baseMed} onToggleNotifications={vi.fn()} />
    );
    expect(container.querySelector("[data-notification-state]")).toHaveAttribute(
      "data-notification-state",
      "on"
    );
  });

  it("shows a distinct muted-today state when the entry is silenced for today", () => {
    const { container } = render(
      <MedicationCard
        medication={{ ...baseMed, muted_today: true }}
        onToggleNotifications={vi.fn()}
      />
    );
    expect(container.querySelector("[data-notification-state]")).toHaveAttribute(
      "data-notification-state",
      "muted_today"
    );
  });

  it("shows the off state when notifications are disabled entirely", () => {
    const { container } = render(
      <MedicationCard
        medication={{ ...baseMed, notifications_enabled: false }}
        onToggleNotifications={vi.fn()}
      />
    );
    expect(container.querySelector("[data-notification-state]")).toHaveAttribute(
      "data-notification-state",
      "off"
    );
  });

  it("keeps the off state when a disabled entry is also muted today", () => {
    const { container } = render(
      <MedicationCard
        medication={{ ...baseMed, notifications_enabled: false, muted_today: true }}
        onToggleNotifications={vi.fn()}
      />
    );
    expect(container.querySelector("[data-notification-state]")).toHaveAttribute(
      "data-notification-state",
      "off"
    );
  });

  it("reports the flipped notifications flag when the bell is clicked", () => {
    const onToggleNotifications = vi.fn();
    render(
      <MedicationCard medication={baseMed} onToggleNotifications={onToggleNotifications} />
    );

    fireEvent.click(screen.getByLabelText("mute_notifications"));
    expect(onToggleNotifications).toHaveBeenCalledWith(false);
  });

  it("renders active toggle reflecting the active flag and reports flips", () => {
    const onToggleActive = vi.fn();
    render(
      <MedicationCard
        medication={{ ...baseMed, active: false }}
        onToggleActive={onToggleActive}
      />
    );

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(onToggleActive).toHaveBeenCalledWith(true);
  });
});
