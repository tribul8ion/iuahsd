import type { DosageUnit } from "../model/types";

interface DosageInputProps {
  amountRaw: string;
  onAmountChange: (next: string) => void;
  unit: DosageUnit;
  onOpenUnitModal: () => void;
  amountPlaceholder: string;
  unitLabel: (unit: DosageUnit) => string;
}

export function DosageInput({
  amountRaw,
  onAmountChange,
  unit,
  onOpenUnitModal,
  amountPlaceholder,
  unitLabel,
}: DosageInputProps) {
  const handleChange = (value: string) => {
    const filtered = value.replace(/[^\d.,]/g, "").slice(0, 5);
    onAmountChange(filtered);
  };

  return (
    <div
      className="flex items-center rounded-xl"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", padding: "0 14px", height: 48, gap: 8 }}
    >
      <input
        type="text"
        inputMode="decimal"
        value={amountRaw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={amountPlaceholder}
        maxLength={5}
        className="flex-1 min-w-0 text-[15px] bg-transparent outline-none placeholder:text-[rgba(255,255,255,0.28)]"
        style={{ color: "var(--color-text)" }}
        aria-label="dosage-amount"
      />
      <button
        onClick={onOpenUnitModal}
        className="h-9 rounded-full text-[13px] font-medium cursor-pointer flex-shrink-0"
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "var(--color-text)",
          padding: "0 14px",
          maxWidth: "50%",
        }}
        aria-label="dosage-unit"
      >
        <span className="truncate block">{unitLabel(unit)}</span>
      </button>
    </div>
  );
}
