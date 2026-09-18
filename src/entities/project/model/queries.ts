import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import { QUERY_STALE_TIME } from "@/shared/config";
import { toProject } from "./decrypt";
import type { ProjectDto } from "./types";

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
};

interface ProjectListResponse {
  projects: ProjectDto[];
}

export function useProjects() {
  const cryptoKey = useSessionStore((s) => s.cryptoKey);

  return useQuery({
    queryKey: projectKeys.list(),
    enabled: cryptoKey !== null,
    queryFn: async () => {
      if (cryptoKey === null) {
        throw new Error("crypto_key_missing");
      }
      const response = await apiClient.get<ProjectListResponse>("/projects");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch projects");
      }
      return Promise.all(response.data.projects.map((dto) => toProject(dto, cryptoKey)));
    },
    staleTime: QUERY_STALE_TIME,
  });
}
