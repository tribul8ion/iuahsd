import type { Entry } from "./types";

export type NotificationState = "on" | "muted_today" | "off";

export function notificationState(entry: Entry): NotificationState {
  if (!entry.notifications_enabled) return "off";
  if (entry.muted_today) return "muted_today";
  return "on";
}
