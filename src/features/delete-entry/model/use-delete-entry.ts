import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { entryKeys } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { markKeys } from "@/entities/mark";
import { projectKeys } from "@/entities/project";
import { hapticFeedback } from "@/shared/lib";

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiClient.delete<void>(`/entries/${entryId}`);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to delete entry");
      }
      return entryId;
    },
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: entryKeys.list() });

      const previous = queryClient.getQueryData<Entry[]>(entryKeys.list());
      const wasTask = previous?.find((e) => e.id === entryId)?.kind === "task";

      queryClient.setQueryData<Entry[]>(
        entryKeys.list(),
        (old) => old?.filter((e) => e.id !== entryId)
      );

      hapticFeedback("impact", "medium");

      return { previous, wasTask };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(entryKeys.list(), context.previous);
      }
      hapticFeedback("notification", "error");
    },
    onSettled: (_data, _error, _id, context) => {
      queryClient.invalidateQueries({ queryKey: entryKeys.list() });
      queryClient.invalidateQueries({ queryKey: markKeys.all });
      if (context?.wasTask) {
        queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      }
    },
  });
}
