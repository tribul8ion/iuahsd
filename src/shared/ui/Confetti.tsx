import { useMemo } from "react";

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  color: string;
  rotate: number;
}

const COLORS = ["#059669", "#F97316", "#FBBF24", "#7C3AED", "#EC4899"];
const PIECE_COUNT = 24;

function buildPieces(): ConfettiPiece[] {
  return Array.from({ length: PIECE_COUNT }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 250,
    color: COLORS[index % COLORS.length],
    rotate: Math.random() * 360,
  }));
}

export function Confetti() {
  const pieces = useMemo(() => buildPieces(), []);

  return (
    <div
      data-testid="confetti"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-[1200]"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: "-10px",
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
