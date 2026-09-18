import {
  postEvent,
  retrieveLaunchParams,
} from "@telegram-apps/sdk-react";

type ImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationStyle = "error" | "success" | "warning";

export function hapticFeedback(
  type: "impact",
  style?: ImpactStyle
): void;
export function hapticFeedback(
  type: "notification",
  style?: NotificationStyle
): void;
export function hapticFeedback(type: "selection_change"): void;
export function hapticFeedback(
  type: "impact" | "notification" | "selection_change",
  style?: string
): void {
  try {
    if (type === "impact") {
      postEvent("web_app_trigger_haptic_feedback", {
        type: "impact",
        impact_style: (style as ImpactStyle) ?? "light",
      });
    } else if (type === "notification") {
      postEvent("web_app_trigger_haptic_feedback", {
        type: "notification",
        notification_type: (style as NotificationStyle) ?? "success",
      });
    } else {
      postEvent("web_app_trigger_haptic_feedback", {
        type: "selection_change",
      });
    }
  } catch {
    void 0;
  }
}

export function closeApp(): void {
  try {
    postEvent("web_app_close");
  } catch {
    void 0;
  }
}

export function getUserLanguage(): string {
  try {
    const params = retrieveLaunchParams(true);
    return params.tgWebAppData?.user?.languageCode ?? "en";
  } catch {
    return "en";
  }
}

export function getUserFirstName(): string | null {
  try {
    const params = retrieveLaunchParams(true);
    return params.tgWebAppData?.user?.firstName ?? null;
  } catch {
    return null;
  }
}
