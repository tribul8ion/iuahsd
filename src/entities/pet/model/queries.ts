import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { QUERY_STALE_TIME } from "@/shared/config";
import type { PetDto } from "./types";

export const petKeys = {
  all: ["pet"] as const,
  detail: () => [...petKeys.all, "detail"] as const,
};

export function usePet() {
  return useQuery({
    queryKey: petKeys.detail(),
    queryFn: async (): Promise<PetDto> => {
      const response = await apiClient.get<PetDto>("/pet");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch pet");
      }
      return response.data;
    },
    staleTime: QUERY_STALE_TIME,
  });
}
