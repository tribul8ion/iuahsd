import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import { QUERY_STALE_TIME } from "@/shared/config";
import { toEntry } from "./decrypt";
import type { EntryDto } from "./types";

export const entryKeys = {
  all: ["entries"] as const,
  list: () => [...entryKeys.all, "list"] as const,
};

interface EntryListResponse {
  entries: EntryDto[];
  count: number;
}

export function useEntries() {
  const cryptoKey = useSessionStore((s) => s.cryptoKey);

  return useQuery({
    queryKey: entryKeys.list(),
    enabled: cryptoKey !== null,
    queryFn: async () => {
      if (cryptoKey === null) {
        throw new Error("crypto_key_missing");
      }
      const response = await apiClient.get<EntryListResponse>("/entries");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch entries");
      }
      return Promise.all(response.data.entries.map((dto) => toEntry(dto, cryptoKey)));
    },
    staleTime: QUERY_STALE_TIME,
  });
}
