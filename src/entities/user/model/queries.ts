import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { User, UserSettings } from "./types";
import { QUERY_STALE_TIME } from "@/shared/config";

export const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
  settings: () => [...userKeys.all, "settings"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const response = await apiClient.get<User>("/me");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch user");
      }
      return response.data;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useUserSettings() {
  return useQuery({
    queryKey: userKeys.settings(),
    queryFn: async () => {
      const response = await apiClient.get<UserSettings>("/settings");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch settings");
      }
      return response.data;
    },
    staleTime: QUERY_STALE_TIME,
  });
}
