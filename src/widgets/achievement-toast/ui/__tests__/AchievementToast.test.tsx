import { render, screen, fireEvent } from "@testing-library/react";
import { AchievementToast } from "../AchievementToast";
import { useAchievementQueueStore } from "@/features/mark-taken";
import { hapticFeedback } from "@/shared/lib";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/shared/lib", () => ({
  hapticFeedback: vi.fn(),
}));

describe("AchievementToast", () => {
  afterEach(() => {
    useAchievementQueueStore.setState({ queue: [] });
    vi.clearAllMocks();
  });

  it("renders nothing when the queue is empty", () => {
    render(<AchievementToast />);
    expect(screen.queryByText("toast.close")).not.toBeInTheDocument();
  });

  it("shows the emoji and name of the first queued achievement", () => {
    useAchievementQueueStore.setState({ queue: ["first_step", "combo_5"] });
    render(<AchievementToast />);

    expect(screen.getByText("🌱")).toBeInTheDocument();
    expect(screen.getByText("achievements.badges.first_step.name")).toBeInTheDocument();
  });

  it("triggers a success haptic when a new achievement appears", () => {
    useAchievementQueueStore.setState({ queue: ["first_step"] });
    render(<AchievementToast />);

    expect(hapticFeedback).toHaveBeenCalledWith("notification", "success");
  });

  it("dequeues and reveals the next achievement when closed", () => {
    useAchievementQueueStore.setState({ queue: ["first_step", "combo_5"] });
    render(<AchievementToast />);

    fireEvent.click(screen.getByText("toast.close"));

    expect(useAchievementQueueStore.getState().queue).toEqual(["combo_5"]);
    expect(screen.getByText("achievements.badges.combo_5.name")).toBeInTheDocument();
  });

  it("hides the overlay once the queue is drained", () => {
    useAchievementQueueStore.setState({ queue: ["first_step"] });
    render(<AchievementToast />);

    fireEvent.click(screen.getByText("toast.close"));

    expect(screen.queryByText("toast.close")).not.toBeInTheDocument();
  });
});
