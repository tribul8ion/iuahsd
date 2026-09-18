interface StreakPillProps {
  streak: number;
  onClick?: () => void;
}

const PILL_STYLE: React.CSSProperties = {
  backgroundColor: "#FBF3E7",
  color: "#C77414",
  padding: "4px 10px",
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
