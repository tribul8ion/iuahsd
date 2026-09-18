import { useTranslation } from "react-i18next";

interface ProfileHeaderProps {
  displayName: string;
  memberSinceDate: string | null;
}

export function ProfileHeader({ displayName, memberSinceDate }: ProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <header
      className="rounded-b-[32px] flex flex-col justify-center gap-1 overflow-hidden"
      style={{
        position: "relative",
        background: "var(--gradient-header)",
        minHeight: 160,
        padding: "52px 20px 24px 20px",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          top: -70,
          right: -40,
          width: 190,
          height: 190,
          background: "radial-gradient(circle, rgba(167,243,208,0.35) 0%, rgba(167,243,208,0) 68%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none rounded-full"
        style={{
          position: "absolute",
          bottom: -90,
          left: -30,
          width: 220,
          height: 220,
          background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)",
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
