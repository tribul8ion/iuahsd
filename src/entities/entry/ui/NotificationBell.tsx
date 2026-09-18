import { useTranslation } from "react-i18next";
import { Bell, BellOff } from "lucide-react";
import type { Entry } from "../model/types";
import { notificationState } from "../model/notification-state";

interface NotificationBellProps {
  entry: Entry;
  onToggle: (enabled: boolean) => void;
}

const STATE_COLORS = {
  on: "#F9FFD0",
  muted_today: "#FBBF24",
  off: "var(--color-text-hint)",
} as const;

export function NotificationBell({ entry, onToggle }: NotificationBellProps) {
  const { t } = useTranslation();

  const state = notificationState(entry);
  const Icon = state === "on" ? Bell : BellOff;

  return (
    <button
      onClick={() => onToggle(!entry.notifications_enabled)}
      className="cursor-pointer p-1"
      data-notification-state={state}
      aria-label={
        entry.notifications_enabled
          ? t("common.mute_notifications")
          : t("common.unmute_notifications")
      }
      title={state === "muted_today" ? t("common.muted_today_hint") : undefined}
    >
      <Icon size={20} color={STATE_COLORS[state]} strokeWidth={1.8} />
    </button>
  );
}
