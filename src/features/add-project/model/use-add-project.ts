import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { encryptProjectPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { projectKeys, toProject } from "@/entities/project";
import type { Project, ProjectDto } from "@/entities/project";
import { hapticFeedback } from "@/shared/lib";

export function useAddProject() {
  const queryClient = useQueryClient();
  const cryptoKey = useSessionStore((s) => s.cryptoKey);

  return useMutation<Project, Error, string>({
    mutationFn: async (name) => {
      if (cryptoKey === null) {
        throw new Error("crypto_key_missing");
      }
      const payloadEncrypted = await encryptProjectPayload({ v: 1, name }, cryptoKey);
      const response = await apiClient.post<ProjectDto>("/projects", {
        payload_encrypted: payloadEncrypted,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to add project");
      }
      return toProject(response.data, cryptoKey);
    },
    onSuccess: (newProject) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.list(),
        (old) => (old ? [...old, newProject] : [newProject])
      );
      hapticFeedback("notification", "success");
    },
    onError: () => {
      hapticFeedback("notification", "error");
    },
  });
}
