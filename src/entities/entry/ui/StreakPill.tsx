interface StreakPillProps {
  streak: number;
  onClick?: () => void;
}

const PILL_STYLE: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(255,248,238,0.95) 0%, rgba(255,237,213,0.9) 100%)",
  color: "#B45309",
  border: "1px solid rgba(255,255,255,0.8)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 3px 8px -3px rgba(180,83,9,0.3)",
  padding: "3px 10px",
  fontSize: 12,
  fontWeight: 700,
};

export function StreakPill({ streak, onClick }: StreakPillProps) {
  if (streak <= 0) {
    return null;
  }

  const content = (
    <>
      <span aria-hidden="true">🔥</span>
      <span>{streak}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        aria-label="streak"
        className="flex-shrink-0 flex items-center gap-1 rounded-full cursor-pointer"
        style={PILL_STYLE}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      aria-label="streak"
      className="flex-shrink-0 flex items-center gap-1 rounded-full"
      style={PILL_STYLE}
    >
      {content}
    </div>
  );
}
