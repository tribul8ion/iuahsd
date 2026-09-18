import { DecryptError, UnsupportedVersionError, decryptPayload } from "@/shared/crypto";
import type { ExportFile, ExportMedicationDto, ExportMedicationItem, ExportResponseDto } from "./types";

async function toExportMedication(
  dto: ExportMedicationDto,
  key: Uint8Array
): Promise<ExportMedicationItem> {
  const metadata = {
    id: dto.id,
    schedule: dto.schedule,
    time: dto.time,
    frequency_type: dto.frequency_type,
    interval_days: dto.interval_days,
    start_date: dto.start_date,
    active: dto.active,
  };

  if (dto.payload_encrypted === null) {
    return { ...metadata, name: "", dose_amount: null, dose_unit: null, notes: null, corrupted: true };
  }

  try {
    const payload = await decryptPayload(dto.payload_encrypted, key);
    return {
      ...metadata,
      name: payload.name,
      dose_amount: payload.dose_amount,
      dose_unit: payload.dose_unit,
      notes: payload.notes,
      corrupted: false,
    };
  } catch (error) {
    if (
      error instanceof DecryptError ||
      error instanceof UnsupportedVersionError ||
      error instanceof SyntaxError
    ) {
      return { ...metadata, name: "", dose_amount: null, dose_unit: null, notes: null, corrupted: true };
    }
    throw error;
  }
}

export async function buildExportFile(
  data: ExportResponseDto,
  key: Uint8Array
): Promise<ExportFile> {
  const medications = await Promise.all(
    data.medications.map((dto) => toExportMedication(dto, key))
  );
  return {
    exported_at: data.exported_at,
    medications,
    settings: data.settings,
    consents: data.consents,
  };
}

export function downloadExportFile(file: ExportFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "med-reminder-export.json";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
