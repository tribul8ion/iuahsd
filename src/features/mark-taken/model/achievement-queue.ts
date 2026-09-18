import { create } from "zustand";
import type { AchievementId } from "@/entities/achievement";

interface AchievementQueueState {
  queue: AchievementId[];
  enqueue: (ids: readonly AchievementId[]) => void;
  dequeue: () => void;
}

export const useAchievementQueueStore = create<AchievementQueueState>((set) => ({
  queue: [],
  enqueue: (ids) =>
    set((state) => ({
      queue: ids.length > 0 ? [...state.queue, ...ids] : state.queue,
    })),
  dequeue: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
