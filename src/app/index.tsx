import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  TelegramProvider,
  QueryProvider,
  AppRouterProvider,
  BootProvider,
} from "./providers";
import { AppRoutes } from "./routes";
import { BottomNav } from "@/widgets/navigation";
import { AddEntrySheet } from "@/features/add-entry";
import { MoreMenuSheet } from "@/widgets/more-menu";
import { AchievementToast } from "@/widgets/achievement-toast";
import { ErrorBoundary } from "@/shared/ui";
import { apiClient } from "@/shared/api";
import { useCurrentUser, useUserSettings, useUserStore } from "@/entities/user";
import "./styles/global.css";

function ProfileLoader() {
  const { data: profile } = useCurrentUser();
  const setIsAdmin = useUserStore((s) => s.setIsAdmin);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!profile) return;
    setIsAdmin(profile.is_admin === true);
    if (profile.language && profile.language !== i18n.language) {
      setLanguage(profile.language);
      i18n.changeLanguage(profile.language);
    }
  }, [profile, setIsAdmin, setLanguage, i18n]);

  return null;
}

function TimezoneSync() {
  const { data: settings } = useUserSettings();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current || !settings || settings.timezone) return;
    syncedRef.current = true;
    void apiClient.patch("/settings", {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, [settings]);

  return null;
}

function AppContent() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <ProfileLoader />
      <TimezoneSync />
      <ErrorBoundary key={location.pathname}>
        <AppRoutes />
      </ErrorBoundary>
      <BottomNav onAdd={() => setIsAddSheetOpen(true)} onMore={() => setIsMoreOpen(true)} />
      <AddEntrySheet
        key={isAddSheetOpen ? "add-open" : "add-closed"}
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
      />
      <MoreMenuSheet
        key={isMoreOpen ? "more-open" : "more-closed"}
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
      <AchievementToast />
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AppRouterProvider>
          <TelegramProvider>
            <BootProvider>
              <AppContent />
            </BootProvider>
          </TelegramProvider>
        </AppRouterProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
