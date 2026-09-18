import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { entryKeys } from "@/entities/entry";
import type { Entry, EntryDto } from "@/entities/entry";
import { hapticFeedback } from "@/shared/lib";

interface ToggleNotificationsVariables {
  id: number;
  notifications_enabled: boolean;
}

export function useToggleEntryNotifications() {
  const queryClient = useQueryClient();

  return useMutation<EntryDto, Error, ToggleNotificationsVariables>({
    mutationFn: async ({ id, notifications_enabled }) => {
      const response = await apiClient.put<EntryDto>(`/entries/${id}`, {
        notifications_enabled,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to toggle notifications");
      }
      return response.data;
    },
    onSuccess: (dto) => {
      queryClient.setQueryData<Entry[]>(entryKeys.list(), (old) =>
        old
          ? old.map((e) =>
              e.id === dto.id
                ? {
                    ...e,
                    notifications_enabled: dto.notifications_enabled,
                    muted_today: dto.muted_today,
                  }
                : e
            )
          : old
      );
      hapticFeedback("selection_change");
    },
    onError: () => {
      hapticFeedback("notification", "error");
    },
  });
}
