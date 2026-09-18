import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import type { Entry } from "../model/types";
import { daySlotForTime, DAY_SLOT_ICONS, DAY_SLOT_COLORS } from "../model/day-slot";
import { colorHex } from "../model/colors";
import { NotificationBell } from "./NotificationBell";

interface MedicationCardProps {
  medication: Entry;
  after?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: (active: boolean) => void;
  onToggleNotifications?: (enabled: boolean) => void;
  onClick?: () => void;
}

export function MedicationCard({
  medication,
  after,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleNotifications,
}: MedicationCardProps) {
  const { t } = useTranslation();

  const scheduleLabel = t(`medications.${medication.schedule}`);
  const slot = daySlotForTime(medication.time);
  const Icon = DAY_SLOT_ICONS[slot];
  const colors = DAY_SLOT_COLORS[slot];

  const intervalSuffix =
    medication.frequency_type === "interval" && medication.interval_days
      ? ` · ${t("medications.frequency_interval_short", { n: medication.interval_days })}`
      : "";

  const dosageSuffix =
    medication.doseAmount !== null && medication.doseUnit
      ? ` · ${medication.doseAmount} ${t(
          `medications.dosage_unit_short.${medication.doseUnit}`
        )}`
      : "";

  return (
    <div
      className="glass flex items-center rounded-[24px]"
      style={{
        gap: 12,
        padding: "0 16px",
        height: 80,
        opacity: medication.active ? 1 : 0.55,
      }}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#2C2C2E" }}
      >
        <Icon size={22} strokeWidth={1.9} color={colors.icon} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center" style={{ gap: 6 }}>
          <p
            className="text-[13px] font-semibold leading-snug truncate uppercase"
            style={{
              letterSpacing: "0.05em",
              color: medication.corrupted ? "var(--color-text-hint)" : "var(--color-text)",
            }}
          >
            {medication.corrupted ? t("medications.corrupted_entry") : medication.name}
          </p>
          {colorHex(medication.color) && (
            <span
              aria-label="medication-color"
              className="rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, backgroundColor: colorHex(medication.color) as string }}
            />
          )}
        </div>
        <p className="text-[13px] mt-0.5 truncate" style={{ color: "var(--color-text-secondary)" }}>
          {scheduleLabel} &middot; {medication.time}
          {intervalSuffix}
          {dosageSuffix}
        </p>
      </div>

      {after && (
        <div className="flex-shrink-0 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {after}
        </div>
      )}

      {!after && (onEdit || onDelete || onToggleActive || onToggleNotifications) && (
        <div className="flex-shrink-0 flex items-center gap-3">
          {onToggleNotifications && (
            <NotificationBell entry={medication} onToggle={onToggleNotifications} />
          )}
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(!medication.active)}
              role="switch"
              aria-checked={medication.active}
              aria-label="toggle-active"
              className="cursor-pointer w-[42px] h-[26px] rounded-full relative transition-colors duration-200"
              style={{
                backgroundColor: medication.active ? "#F9FFD0" : "rgba(255,255,255,0.18)",
                boxShadow: medication.active ? "0 2px 8px rgba(249,255,208,0.3)" : "inset 0 1px 2px rgba(30,41,59,0.06)",
              }}
            >
              <span
                className="absolute top-[3px] w-[20px] h-[20px] rounded-full transition-transform duration-200"
                style={{
                  transform: medication.active ? "translateX(19px)" : "translateX(3px)",
                  backgroundColor: medication.active ? "#1C1C1E" : "#E5E2E1",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  left: 0,
                }}
              />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="cursor-pointer p-1" aria-label="edit-medication">
              <Pencil size={20} color="var(--color-text-hint)" strokeWidth={1.8} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="cursor-pointer p-1" aria-label="delete-medication">
              <Trash2 size={20} color="rgba(255,255,255,0.25)" strokeWidth={1.8} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
