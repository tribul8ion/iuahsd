export interface User {
  id: number;
  telegram_id: number;
  language: string;
  is_admin: boolean;
  created_at: string | null;
  last_active: string | null;
  medications_count: number;
  entries_count: number;
  crypto_initialized: boolean;
  current_policy_version: string;
  last_accepted_policy_version: string | null;
  needs_consent_refresh: boolean;
}

export interface UserSettings {
  reminders_enabled: boolean;
  reminder_repeat_minutes: number;
  muted_today: boolean;
  language: string;
  timezone: string;
}
