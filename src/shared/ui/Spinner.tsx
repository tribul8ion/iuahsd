import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "s" | "m" | "l";
}

const SIZE_MAP = { s: 18, m: 22, l: 28 };

export function Spinner({ size = "m" }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 74px)" }}>
      <Loader2
        size={SIZE_MAP[size]}
        className="animate-spin"
        strokeWidth={2}
        color="#059669"
      />
    </div>
  );
}
