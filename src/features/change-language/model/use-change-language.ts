import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/shared/api";
import { userKeys } from "@/entities/user";
import { useUserStore } from "@/entities/user";
import { hapticFeedback } from "@/shared/lib";

export function useChangeLanguage() {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const setLanguage = useUserStore((s) => s.setLanguage);

  return useMutation({
    mutationFn: async (language: string) => {
      const response = await apiClient.patch<void>("/settings", { language });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to change language");
      }
      return language;
    },
    onMutate: async (language) => {
      const previous = i18n.language;
      await i18n.changeLanguage(language);
      setLanguage(language);
      hapticFeedback("selection_change");
      return { previous };
    },
    onError: (_err, _lang, context) => {
      i18n.changeLanguage(context?.previous ?? "ru");
      setLanguage(context?.previous ?? "ru");
      hapticFeedback("notification", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
}
