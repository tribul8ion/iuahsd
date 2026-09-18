import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { projectKeys } from "@/entities/project";
import type { Project } from "@/entities/project";
import { entryKeys } from "@/entities/entry";
import { hapticFeedback } from "@/shared/lib";

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: number) => {
      const response = await apiClient.delete<void>(`/projects/${projectId}`);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to delete project");
      }
      return projectId;
    },
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.list() });

      const previous = queryClient.getQueryData<Project[]>(projectKeys.list());

      queryClient.setQueryData<Project[]>(
        projectKeys.list(),
        (old) => old?.filter((p) => p.id !== projectId)
      );

      hapticFeedback("impact", "medium");

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectKeys.list(), context.previous);
      }
      hapticFeedback("notification", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      queryClient.invalidateQueries({ queryKey: entryKeys.list() });
    },
  });
}
