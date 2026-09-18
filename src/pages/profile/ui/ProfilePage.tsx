import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellOff,
  Timer,
  Check,
  Pencil,
  Trash2,
  KeyRound,
  Download,
} from "lucide-react";
import { LanguageSelector } from "@/features/change-language";
import { DeleteAccountModal } from "@/features/delete-account";
import { ChangePassphraseModal } from "@/features/change-passphrase";
import { ExportModal } from "@/features/export";
import { useCurrentUser, useUserSettings, userKeys } from "@/entities/user";
import { ACHIEVEMENTS, useAchievements } from "@/entities/achievement";
import { useEntries } from "@/entities/entry";
import type { UserSettings } from "@/entities/user";
import { apiClient } from "@/shared/api";
import { Spinner, SectionHeader, SettingsRow } from "@/shared/ui";
import { hapticFeedback, getUserFirstName } from "@/shared/lib";
import { formatMemberSinceDate, computeBestStreak } from "../model/stats";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileStats } from "./ProfileStats";
import { CustomIntervalModal } from "./CustomIntervalModal";
import { NotificationToday } from "./NotificationToday";

const REPEAT_OPTIONS = [5, 15, 30];

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useUserSettings();
  const { data: profile } = useCurrentUser();
  const { data: earnedAchievements } = useAchievements();
  const { data: entries } = useEntries();
  const achievementsCount = earnedAchievements?.length ?? 0;
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [changePassphraseOpen, setChangePassphraseOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const displayName = useMemo(() => getUserFirstName() ?? t("profile.you"), [t]);
  const memberSinceDate = useMemo(
    () => formatMemberSinceDate(profile?.created_at ?? null, i18n.language),
    [profile?.created_at, i18n.language]
  );
  const bestStreak = useMemo(() => computeBestStreak(entries), [entries]);

  const lastCustom = useMemo(() => {
    if (settings?.reminder_repeat_minutes && !REPEAT_OPTIONS.includes(settings.reminder_repeat_minutes)) {
      return settings.reminder_repeat_minutes;
    }
    return null;
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (payload: Partial<UserSettings>) => {
      const response = await apiClient.patch<UserSettings>("/settings", payload);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to update settings");
      }
      return response.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: userKeys.settings() });
      const previous = queryClient.getQueryData<UserSettings>(userKeys.settings());

      queryClient.setQueryData<UserSettings>(
        userKeys.settings(),
        (old) => (old ? { ...old, ...payload } : old)
      );

      hapticFeedback("selection_change");
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(userKeys.settings(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.settings() });
    },
  });

  const handleToggleReminders = useCallback(() => {
    if (!settings) return;
    updateSettings.mutate({
      reminders_enabled: !settings.reminders_enabled,
    });
  }, [settings, updateSettings]);

  const handleRepeatChange = useCallback(
    (minutes: number) => {
      updateSettings.mutate({ reminder_repeat_minutes: minutes });
    },
    [updateSettings]
  );

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-full" style={{ paddingBottom: "calc(74px + 16px + env(safe-area-inset-bottom))" }}>
      <ProfileHeader displayName={displayName} memberSinceDate={memberSinceDate} />

      <div className="flex flex-col gap-3" style={{ padding: "16px 16px 0 16px" }}>
        <ProfileStats
          entriesCount={profile?.entries_count ?? 0}
          achievementsEarned={achievementsCount}
          achievementsTotal={ACHIEVEMENTS.length}
          bestStreak={bestStreak}
        />

        <LanguageSelector />

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
        >
          <SectionHeader title={t("settings.reminders_settings")} />

          <button
            onClick={handleToggleReminders}
            role="switch"
            aria-checked={settings?.reminders_enabled ?? false}
            className="flex items-center w-full cursor-pointer"
            style={{ gap: 12, padding: "0 16px", height: 56 }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: settings?.reminders_enabled ? "#ECFDF5" : "#F5F5F4",
              }}
            >
              {settings?.reminders_enabled
                ? <Bell size={20} strokeWidth={1.8} color="#059669" />
                : <BellOff size={20} strokeWidth={1.8} color="#A8A29E" />
              }
            </div>
            <span className="flex-1 text-left text-[15px] font-medium" style={{ color: "#1C1917" }}>
              {settings?.reminders_enabled
                ? t("settings.reminders_enabled")
                : t("settings.reminders_disabled")}
            </span>
            <div
              className="w-[46px] h-[28px] rounded-full relative flex-shrink-0 transition-colors duration-200"
              style={{ backgroundColor: settings?.reminders_enabled ? "#059669" : "#E7E5E4" }}
            >
              <div
                className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white transition-transform duration-200"
                style={{
                  transform: settings?.reminders_enabled ? "translateX(21px)" : "translateX(3px)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.13)",
                }}
              />
            </div>
          </button>

          {settings?.reminders_enabled && (
            <>
              <div style={{ height: 1, backgroundColor: "#F5F5F4" }} />
              <NotificationToday settings={settings} />
            </>
          )}
        </div>

        {settings?.reminders_enabled && (
          <div
            className="rounded-2xl overflow-hidden animate-fade-in"
            style={{ backgroundColor: "#FFFFFF", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
          >
            <SectionHeader title={t("settings.select_repeat_interval")} />
            {REPEAT_OPTIONS.map((minutes, idx) => {
              const isSelected = settings?.reminder_repeat_minutes === minutes;
              return (
                <div key={minutes}>
                  {idx > 0 && <div style={{ height: 1, backgroundColor: "#F5F5F4" }} />}
                  <button
                    onClick={() => handleRepeatChange(minutes)}
                    className="flex items-center w-full cursor-pointer"
                    style={{ gap: 12, padding: "0 16px", height: 48 }}
                  >
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? "#ECFDF5" : "#F5F5F4",
                      }}
                    >
                      <Timer size={18} strokeWidth={1.8} color={isSelected ? "#059669" : "#A8A29E"} />
                    </div>
                    <span
                      className="flex-1 text-left text-[15px]"
                      style={{
                        color: isSelected ? "#1C1917" : "#57534E",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {minutes} {t("settings.minutes")}
                    </span>
                    {isSelected && <Check size={18} color="#059669" strokeWidth={2.5} />}
                  </button>
                </div>
              );
            })}
            <div style={{ height: 1, backgroundColor: "#F5F5F4" }} />
            {(() => {
              const isCustomSelected = !REPEAT_OPTIONS.includes(settings?.reminder_repeat_minutes ?? 5);
              const hasCustom = lastCustom !== null;
              return (
                <div
                  className="flex items-center w-full"
                  style={{ padding: "0 16px", height: 48 }}
                >
                  <button
                    onClick={() => {
                      if (hasCustom) {
                        handleRepeatChange(lastCustom);
                      } else {
                        setCustomModalOpen(true);
                      }
                    }}
                    className="flex items-center flex-1 h-full cursor-pointer min-w-0"
                    style={{ gap: 12 }}
                  >
                    <div
                      className="flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center"
                      style={{ backgroundColor: isCustomSelected ? "#ECFDF5" : "#F5F5F4" }}
                    >
                      <Timer size={18} strokeWidth={1.8} color={isCustomSelected ? "#059669" : "#A8A29E"} />
                    </div>
                    <span
                      className="flex-1 text-left text-[15px] truncate"
                      style={{
                        color: isCustomSelected ? "#1C1917" : "#57534E",
                        fontWeight: isCustomSelected ? 600 : 400,
                      }}
                    >
                      {hasCustom
                        ? `${lastCustom} ${t("settings.minutes")}`
                        : t("settings.custom")}
                    </span>
                  </button>
                  {isCustomSelected && <Check size={18} color="#059669" strokeWidth={2.5} style={{ flexShrink: 0 }} />}
                  {hasCustom && (
                    <button
                      onClick={() => setCustomModalOpen(true)}
                      className="cursor-pointer p-1 flex-shrink-0"
                      style={{ marginLeft: 8 }}
                    >
                      <Pencil size={14} color="#A8A29E" strokeWidth={1.8} />
                    </button>
                  )}
                  {!hasCustom && <span className="text-[11px] flex-shrink-0" style={{ color: "#A8A29E" }}>1-60</span>}
                </div>
              );
            })()}
          </div>
        )}

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
        >
          <SectionHeader title={t("settings.security")} />
          <SettingsRow
            icon={<KeyRound size={20} strokeWidth={1.8} color="#059669" />}
            iconBackground="#ECFDF5"
            label={t("settings.change_passphrase")}
            onClick={() => setChangePassphraseOpen(true)}
          />
          <div style={{ height: 1, backgroundColor: "#F5F5F4" }} />
          <SettingsRow
            icon={<Download size={20} strokeWidth={1.8} color="#059669" />}
            iconBackground="#ECFDF5"
            label={t("settings.export_data")}
            onClick={() => setExportModalOpen(true)}
          />
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}
        >
          <SectionHeader title={t("settings.danger_zone")} />
          <SettingsRow
            icon={<Trash2 size={20} strokeWidth={1.8} color="#E11D48" />}
            iconBackground="#FFF1F2"
            label={t("settings.delete_account")}
            labelColor="#E11D48"
            labelWeight="semibold"
            onClick={() => setDeleteModalOpen(true)}
          />
        </div>

      </div>

      <CustomIntervalModal
        key={customModalOpen ? "open" : "closed"}
        isOpen={customModalOpen}
        currentValue={lastCustom ?? 10}
        onClose={() => setCustomModalOpen(false)}
        onSave={(minutes) => {
          handleRepeatChange(minutes);
        }}
      />

      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />

      <ChangePassphraseModal
        isOpen={changePassphraseOpen}
        onClose={() => setChangePassphraseOpen(false)}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
