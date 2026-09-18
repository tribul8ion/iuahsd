import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { clearKey } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { hapticFeedback } from "@/shared/lib";

interface DeleteAccountResult {
  deleted: boolean;
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<DeleteAccountResult, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.delete<DeleteAccountResult>("/me", true);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to delete account");
      }
      return response.data;
    },
    onSuccess: () => {
      void clearKey();
      useSessionStore.getState().setCryptoKey(null);
      queryClient.clear();
      hapticFeedback("notification", "success");
      const webApp = window.Telegram?.WebApp;
      if (webApp && typeof webApp.close === "function") {
        webApp.close();
        return;
      }
      window.location.reload();
    },
    onError: () => {
      hapticFeedback("notification", "error");
    },
  });
}
