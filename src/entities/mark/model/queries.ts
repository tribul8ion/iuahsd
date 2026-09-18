import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { MarksResponse, MarksRangeResponse } from "./types";
import { QUERY_STALE_TIME } from "@/shared/config";

export const markKeys = {
  all: ["marks"] as const,
  today: () => [...markKeys.all, "today"] as const,
  byDate: (date: string) => [...markKeys.all, "date", date] as const,
  range: (dateFrom: string, dateTo: string) =>
    [...markKeys.all, "range", dateFrom, dateTo] as const,
};

export function useTodayMarks() {
  return useQuery({
    queryKey: markKeys.today(),
    queryFn: async () => {
      const response = await apiClient.get<MarksResponse>("/marks");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch marks");
      }
      return response.data;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useMarksByDate(date: string) {
  return useQuery({
    queryKey: markKeys.byDate(date),
    queryFn: async () => {
      const response = await apiClient.get<MarksResponse>(`/marks?date=${date}`);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch marks");
      }
      return response.data;
    },
    staleTime: QUERY_STALE_TIME,
  });
}

export function useMarksRange(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: markKeys.range(dateFrom, dateTo),
    queryFn: async () => {
      const response = await apiClient.get<MarksRangeResponse>(
        `/marks/range?date_from=${dateFrom}&date_to=${dateTo}`
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch marks range");
      }
      return response.data;
    },
    staleTime: QUERY_STALE_TIME,
  });
}
