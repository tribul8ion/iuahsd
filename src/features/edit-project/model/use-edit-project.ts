import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { encryptProjectPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { projectKeys, toProject } from "@/entities/project";
import type { Project, ProjectDto } from "@/entities/project";
import { hapticFeedback } from "@/shared/lib";

export interface EditProjectVariables {
  id: number;
  name: string;
}

export function useEditProject() {
  const queryClient = useQueryClient();
  const cryptoKey = useSessionStore((s) => s.cryptoKey);

  return useMutation<Project, Error, EditProjectVariables>({
    mutationFn: async (variables) => {
      if (cryptoKey === null) {
        throw new Error("crypto_key_missing");
      }
      const payloadEncrypted = await encryptProjectPayload(
        { v: 1, name: variables.name },
        cryptoKey
      );
      const response = await apiClient.put<ProjectDto>(`/projects/${variables.id}`, {
        payload_encrypted: payloadEncrypted,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to update project");
      }
      return toProject(response.data, cryptoKey);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Project[]>(projectKeys.list(), (old) =>
        old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
      );
      hapticFeedback("notification", "success");
    },
    onError: () => {
      hapticFeedback("notification", "error");
    },
  });
}
