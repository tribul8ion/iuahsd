import { useTranslation } from "react-i18next";

interface ProfileHeaderProps {
  displayName: string;
  memberSinceDate: string | null;
}

export function ProfileHeader({ displayName, memberSinceDate }: ProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className="rounded-b-[36px] flex flex-col justify-center gap-1 overflow-hidden"
      style={{
        position: "relative",
        background: "var(--gradient-header)",
        minHeight: 160,
        padding: "52px 20px 24px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.22)",
        boxShadow: "0 18px 40px -18px rgba(7, 94, 84, 0.45)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          top: -80,
          right: -50,
          width: 230,
          height: 230,
          background: "radial-gradient(circle, rgba(167,243,208,0.42) 0%, rgba(167,243,208,0) 66%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          bottom: -110,
          left: "30%",
          width: 240,
          height: 240,
          background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      <h1
        className="text-[15px] font-semibold leading-tight"
        style={{ color: "rgba(255,255,255,0.82)", letterSpacing: "0.2px" }}
      >
        {t("profile.title")}
      </h1>
      <p
        className="text-[26px] font-extrabold text-white leading-tight"
        style={{ letterSpacing: "-0.4px" }}
      >
        {displayName}
      </p>
      {memberSinceDate && (
        <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
          {t("profile.member_since", { date: memberSinceDate })}
        </p>
      )}
    </header>
  );
}
