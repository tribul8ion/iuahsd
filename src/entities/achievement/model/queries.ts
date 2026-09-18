import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { QUERY_STALE_TIME } from "@/shared/config";
import type { AchievementsResponse, EarnedAchievement } from "./types";

export const achievementKeys = {
  all: ["achievements"] as const,
  list: () => [...achievementKeys.all, "list"] as const,
};

export function useAchievements() {
  return useQuery({
    queryKey: achievementKeys.list(),
    queryFn: async (): Promise<EarnedAchievement[]> => {
      const response = await apiClient.get<AchievementsResponse>("/achievements");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch achievements");
      }
      return response.data.earned;
    },
    staleTime: QUERY_STALE_TIME,
  });
}
