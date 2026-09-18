import { useTranslation } from "react-i18next";

interface ProfileHeaderProps {
  displayName: string;
  memberSinceDate: string | null;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ProfileHeader({ displayName, memberSinceDate }: ProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className="flex items-center flex-shrink-0"
      style={{
        backgroundColor: "#131313",
        minHeight: 96,
        padding: "56px 20px 16px 20px",
        gap: 14,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 48,
          height: 48,
          backgroundColor: "#2C2C2E",
          border: "1px solid rgba(249,255,208,0.22)",
          color: "#F9FFD0",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
        aria-hidden="true"
      >
        {initialsOf(displayName) || "·"}
      </span>
      <div className="flex flex-col min-w-0" style={{ gap: 2 }}>
        <h1 className="section-label">{t("profile.title")}</h1>
        <p
          className="text-[20px] font-bold leading-tight uppercase truncate"
          style={{ color: "var(--color-text)", letterSpacing: "-0.01em" }}
        >
          {displayName}
        </p>
        {memberSinceDate && (
          <p className="text-[12px] font-medium" style={{ color: "var(--color-text-hint)" }}>
            {t("profile.member_since", { date: memberSinceDate })}
          </p>
        )}
      </div>
    </header>
  );
}
