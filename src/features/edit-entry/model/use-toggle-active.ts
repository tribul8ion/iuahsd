import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { entryKeys } from "@/entities/entry";
import type { Entry, EntryDto } from "@/entities/entry";
import { markKeys } from "@/entities/mark";
import { hapticFeedback } from "@/shared/lib";

interface ToggleActiveVariables {
  id: number;
  active: boolean;
}

export function useToggleEntryActive() {
  const queryClient = useQueryClient();

  return useMutation<EntryDto, Error, ToggleActiveVariables>({
    mutationFn: async ({ id, active }) => {
      const response = await apiClient.put<EntryDto>(`/entries/${id}`, {
        active,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to toggle entry");
      }
      return response.data;
    },
    onSuccess: (dto) => {
      queryClient.setQueryData<Entry[]>(entryKeys.list(), (old) =>
        old
          ? old.map((e) =>
              e.id === dto.id
                ? { ...e, active: dto.active, next_run_at: dto.next_run_at }
                : e
            )
          : old
      );
      queryClient.invalidateQueries({ queryKey: markKeys.all });
      hapticFeedback("selection_change");
    },
    onError: () => {
      hapticFeedback("notification", "error");
    },
  });
}
