export interface ExportMedicationDto {
  id: number;
  payload_encrypted: string | null;
  schedule: string;
  time: string;
  frequency_type: string;
  interval_days: number | null;
  start_date: string | null;
  active: boolean;
  next_run_at: string | null;
  last_sent_at: string | null;
  created_at: string | null;
}

export interface ExportSettingsDto {
  reminders_enabled: boolean;
  reminder_repeat_minutes: number;
  timezone: string | null;
}

export interface ExportConsentDto {
  policy_version: string;
  consent_type: string;
  accepted: boolean;
  accepted_at: string;
  source: string;
}

export interface ExportResponseDto {
  telegram_id: number;
  language: string;
  created_at: string | null;
  exported_at: string;
  medications: ExportMedicationDto[];
  settings: ExportSettingsDto | null;
  consents: ExportConsentDto[];
}

export interface ExportMedicationItem {
  id: number;
  name: string;
  dose_amount: number | null;
  dose_unit: string | null;
  notes: string | null;
  schedule: string;
  time: string;
  frequency_type: string;
  interval_days: number | null;
  start_date: string | null;
  active: boolean;
  corrupted: boolean;
}

export interface ExportFile {
  exported_at: string;
  medications: ExportMedicationItem[];
  settings: ExportSettingsDto | null;
  consents: ExportConsentDto[];
}
