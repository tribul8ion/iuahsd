import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { markKeys } from "@/entities/mark";
import type { MarksResponse } from "@/entities/mark";
import { entryKeys } from "@/entities/entry";
import { projectKeys } from "@/entities/project";
import { achievementKeys } from "@/entities/achievement";
import type { AchievementId } from "@/entities/achievement";
import { petKeys, nextLevelXpForLevel } from "@/entities/pet";
import type { PetDto } from "@/entities/pet";
import { hapticFeedback } from "@/shared/lib";
import { useAchievementQueueStore } from "./achievement-queue";

interface MarkPatchResponse {
  status: boolean;
  newly_awarded: AchievementId[];
  pet?: { xp: number; level: number };
}

interface MarkTakenResult {
  newlyAwarded: AchievementId[];
  pet: { xp: number; level: number } | null;
}

export function useMarkTaken() {
  const queryClient = useQueryClient();
  const enqueueAchievements = useAchievementQueueStore((s) => s.enqueue);

  return useMutation({
    mutationFn: async ({
      markId,
      status,
    }: {
      markId: number;
      status: boolean;
    }): Promise<MarkTakenResult> => {
      const response = await apiClient.patch<MarkPatchResponse>(
        `/marks/${markId}`,
        { status }
      );
      if (!response.success) {
        throw new Error(response.error ?? "Failed to update status");
      }
      return {
        newlyAwarded: response.data?.newly_awarded ?? [],
        pet: response.data?.pet ?? null,
      };
    },
    onMutate: async ({ markId, status }) => {
      await queryClient.cancelQueries({ queryKey: markKeys.today() });

      const previous = queryClient.getQueryData<MarksResponse>(
        markKeys.today()
      );

      queryClient.setQueryData<MarksResponse>(
        markKeys.today(),
        (old) => {
          if (!old) return old;
          const items = old.items.map((entry) =>
            entry.id === markId
              ? { ...entry, status, updated_at: new Date().toISOString() }
              : entry
          );
          const taken = items.filter((i) => i.status).length;
          return { ...old, items, taken };
        }
      );

      hapticFeedback("notification", "success");

      return { previous };
    },
    onSuccess: ({ newlyAwarded, pet }) => {
      if (newlyAwarded.length > 0) {
        enqueueAchievements(newlyAwarded);
      }
      if (pet) {
        queryClient.setQueryData<PetDto>(petKeys.detail(), {
          xp: pet.xp,
          level: pet.level,
          next_level_xp: nextLevelXpForLevel(pet.level),
        });
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(markKeys.today(), context.previous);
      }
      hapticFeedback("notification", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: markKeys.today() });
      queryClient.invalidateQueries({ queryKey: markKeys.all });
      queryClient.invalidateQueries({ queryKey: entryKeys.list() });
      queryClient.invalidateQueries({ queryKey: achievementKeys.list() });
      queryClient.invalidateQueries({ queryKey: petKeys.detail() });
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}
