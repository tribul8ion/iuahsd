import { render, screen } from "@testing-library/react";
import { HabitCard } from "../HabitCard";
import { mockEntries } from "@/test/mocks/handlers";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && typeof vars === "object" && "returnObjects" in vars) {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      }
      return key;
    },
  }),
}));

const habit = mockEntries.find((e) => e.kind === "habit")!;

describe("HabitCard", () => {
  it("does not render a streak pill when streak_current is 0", () => {
    render(<HabitCard habit={{ ...habit, streak_current: 0 }} />);
    expect(screen.queryByLabelText("streak")).not.toBeInTheDocument();
  });

  it("renders a streak pill with the current streak when greater than 0", () => {
    render(<HabitCard habit={{ ...habit, streak_current: 5 }} />);
    const pill = screen.getByLabelText("streak");
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveTextContent("5");
  });
});
