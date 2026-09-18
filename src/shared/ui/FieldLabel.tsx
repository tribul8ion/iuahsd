import type { ReactNode } from "react";

interface FieldLabelProps {
  children: ReactNode;
  marginBottom?: number;
}

export function FieldLabel({ children, marginBottom = 8 }: FieldLabelProps) {
  return (
    <p
      className="text-[11px] font-semibold uppercase"
      style={{ color: "#A8A29E", letterSpacing: "1px", marginBottom }}
    >
      {children}
    </p>
  );
}
