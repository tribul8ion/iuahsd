import { useAchievementQueueStore } from "../achievement-queue";

describe("useAchievementQueueStore", () => {
  afterEach(() => {
    useAchievementQueueStore.setState({ queue: [] });
  });

  it("starts with an empty queue", () => {
    expect(useAchievementQueueStore.getState().queue).toEqual([]);
  });

  it("appends ids to the queue on enqueue", () => {
    useAchievementQueueStore.getState().enqueue(["first_step"]);
    useAchievementQueueStore.getState().enqueue(["combo_5", "hundred"]);

    expect(useAchievementQueueStore.getState().queue).toEqual([
      "first_step",
      "combo_5",
      "hundred",
    ]);
  });

  it("ignores an empty enqueue call", () => {
    useAchievementQueueStore.getState().enqueue(["first_step"]);
    useAchievementQueueStore.getState().enqueue([]);

    expect(useAchievementQueueStore.getState().queue).toEqual(["first_step"]);
  });

  it("removes the front item on dequeue", () => {
    useAchievementQueueStore.getState().enqueue(["first_step", "combo_5"]);
    useAchievementQueueStore.getState().dequeue();

    expect(useAchievementQueueStore.getState().queue).toEqual(["combo_5"]);
  });

  it("is a no-op when dequeuing an empty queue", () => {
    useAchievementQueueStore.getState().dequeue();
    expect(useAchievementQueueStore.getState().queue).toEqual([]);
  });
});
