import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { userKeys } from "@/entities/user";
import type { UserSettings } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { hapticFeedback } from "@/shared/lib";

interface NotificationTodayProps {
  settings: UserSettings;
}

interface MuteTodayContext {
  previous: UserSettings | undefined;
}

export function NotificationToday({ settings }: NotificationTodayProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const muteToday = useMutation<UserSettings, Error, boolean, MuteTodayContext>({
    mutationFn: async (muted) => {
      const response = await apiClient.patch<UserSettings>("/settings", {
        mute_today: muted,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to update notifications");
      }
      return response.data;
    },
    onMutate: async (muted) => {
      await queryClient.cancelQueries({ queryKey: userKeys.settings() });
      const previous = queryClient.getQueryData<UserSettings>(userKeys.settings());

      queryClient.setQueryData<UserSettings>(userKeys.settings(), (old) =>
        old ? { ...old, muted_today: muted } : old
      );

      hapticFeedback("selection_change");
      return { previous };
    },
    onError: (_err, _muted, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.settings(), context.previous);
      }
      hapticFeedback("notification", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.settings() });
    },
  });

  const muted = settings.muted_today;
  const handleToggle = useCallback(() => muteToday.mutate(!muted), [muteToday, muted]);

  return (
    <div className="flex items-center" style={{ gap: 12, padding: "0 16px", height: 56 }}>
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: muted ? "rgba(255,255,255,0.06)" : "rgba(249,255,208,0.12)" }}
      >
        {muted ? (
          <BellOff size={20} strokeWidth={1.8} color="var(--color-text-hint)" />
        ) : (
          <Bell size={20} strokeWidth={1.8} color="#F9FFD0" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium truncate" style={{ color: "var(--color-text)" }}>
          {t("settings.notifications_today")}
        </p>
        <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--color-text-hint)" }}>
          {muted ? t("settings.muted_today") : t("settings.not_muted_today")}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={muteToday.isPending}
        className="flex-shrink-0 cursor-pointer text-[13px] font-semibold"
        style={{ color: "#F9FFD0", opacity: muteToday.isPending ? 0.5 : 1 }}
      >
        {muted ? t("settings.unmute_today") : t("settings.mute_today")}
      </button>
    </div>
  );
}
