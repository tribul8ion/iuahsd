import type { CSSProperties, ReactNode } from "react";

type EmptyStateSize = "lg" | "md";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  minHeight: string;
  size?: EmptyStateSize;
}

interface SizeConfig {
  containerClassName: string;
  boxClassName: string;
  boxStyle: CSSProperties;
}

const SIZE_CONFIG: Record<EmptyStateSize, SizeConfig> = {
  lg: {
    containerClassName: "flex flex-col items-center justify-center gap-4 text-center",
    boxClassName: "w-20 h-20 rounded-[26px] flex items-center justify-center",
    boxStyle: {
      background: "linear-gradient(150deg, #FFFFFF 0%, #EBF8F1 100%)",
      border: "1px solid rgba(5, 150, 105, 0.12)",
      boxShadow: "0 8px 20px -10px rgba(5, 150, 105, 0.22)",
    },
  },
  md: {
    containerClassName: "flex flex-col items-center justify-center gap-3 text-center",
    boxClassName: "w-14 h-14 rounded-[18px] flex items-center justify-center",
    boxStyle: { backgroundColor: "#EDF4F0", border: "1px solid rgba(30,41,59,0.05)" },
  },
};

export function EmptyState({ icon, title, subtitle, minHeight, size = "lg" }: EmptyStateProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div className={config.containerClassName} style={{ minHeight }}>
      <div className={config.boxClassName} style={config.boxStyle}>
        {icon}
      </div>
      <div>
        <p className="text-[15px] font-semibold mb-1" style={{ color: "#1C1917" }}>
          {title}
        </p>
        <p className="text-[13px]" style={{ color: "#A8A29E" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
