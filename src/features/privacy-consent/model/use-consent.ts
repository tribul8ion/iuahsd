import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import type { User } from "@/entities/user";

interface ConsentResult {
  recorded: boolean;
  needs_consent_refresh: boolean;
}

export function useConsent() {
  const queryClient = useQueryClient();

  return useMutation<ConsentResult, Error, string>({
    mutationFn: async (policyVersion) => {
      const response = await apiClient.post<ConsentResult>("/me/consent", {
        policy_version: policyVersion,
        consent_type: "privacy_policy",
        accepted: true,
        source: "miniapp",
      });
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to record consent");
      }
      return response.data;
    },
    onSuccess: (data, policyVersion) => {
      queryClient.setQueryData<User>(userKeys.me(), (old) =>
        old
          ? {
              ...old,
              needs_consent_refresh: data.needs_consent_refresh,
              last_accepted_policy_version: policyVersion,
            }
          : old
      );
    },
  });
}
