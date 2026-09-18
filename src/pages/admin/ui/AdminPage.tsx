import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Users, Pill, CircleCheck } from "lucide-react";
import { apiClient } from "@/shared/api";
import { Spinner, SectionHeader } from "@/shared/ui";

interface TopMed {
  name: string;
  users: number;
}

interface RecentUser {
  id: number;
  registered_ago: string;
  meds_count: number;
}

interface AdminStats {
  total_users: number;
  active_users: number;
  avg_pills: number;
  taken_rate: number;
  dau: number;
  new_today: number;
  new_week: number;
  new_month: number;
  weekly_registrations: number[];
  recent_users: RecentUser[];
  top_medications: TopMed[];
}

const CARD_SHADOW = "0 1px 2px rgba(30,41,59,0.05), 0 8px 20px -12px rgba(30,41,59,0.1)";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BAR_COLORS = ["#D1FAE5", "#A7F3D0", "#6EE7B7", "#34D399", "#10B981", "#F9FFD0", "#34D399"];
const AVATAR_COLORS = ["#D1FAE5", "#EDE9FE", "#FEF3C7"];

function StatCard({ icon, iconColor, value, label }: {
  icon: React.ReactNode;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <div
      className="flex-1 flex flex-col rounded-2xl"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", boxShadow: CARD_SHADOW, padding: 14, gap: 4 }}
    >
      <span style={{ color: iconColor }}>{icon}</span>
      <span className="text-[22px] font-bold" style={{ color: "var(--color-text)" }}>{value}</span>
      <span className="text-[11px] font-medium" style={{ color: "var(--color-text-hint)" }}>{label}</span>
    </div>
  );
}

function MetricCell({ value, label, valueColor }: {
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: 2 }}>
      <span className="text-[22px] font-bold" style={{ color: valueColor ?? "var(--color-text)" }}>{value}</span>
      <span className="text-[11px] font-medium" style={{ color: "var(--color-text-hint)" }}>{label}</span>
    </div>
  );
}

export function AdminPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await apiClient.get<AdminStats>("/admin/stats");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to fetch admin stats");
      }
      return response.data;
    },
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p style={{ color: "var(--color-text-hint)" }}>{t("common.error")}</p>
      </div>
    );
  }

  const maxBar = Math.max(...stats.weekly_registrations, 1);

  return (
    <div className="min-h-full" style={{ backgroundColor: "transparent", paddingBottom: "calc(96px + 16px + env(safe-area-inset-bottom))" }}>
      <div
        className="rounded-b-[28px] flex flex-col justify-center"
        style={{
          background: "linear-gradient(160deg, #1C1917 0%, #292524 100%)",
          height: 140,
          padding: "48px 20px 16px 20px",
          gap: 4,
        }}
      >
        <h1 className="text-[22px] font-bold text-white">{t("admin.title")}</h1>
        <p className="text-[13px] font-medium" style={{ color: "var(--color-text-hint)" }}>
          {t("admin.overview")}
        </p>
      </div>

      <div className="flex flex-col" style={{ padding: "16px 16px 0 16px", gap: 12 }}>
        <div className="flex" style={{ gap: 10 }}>
          <StatCard
            icon={<Users size={18} strokeWidth={1.8} />}
            iconColor="#F9FFD0"
            value={stats.total_users.toLocaleString()}
            label={t("admin.total_users")}
          />
          <StatCard
            icon={<Pill size={18} strokeWidth={1.8} />}
            iconColor="#7C3AED"
            value={Math.round(stats.avg_pills * stats.total_users).toLocaleString()}
            label={t("admin.medications_label")}
          />
        </div>

        <div className="flex" style={{ gap: 10 }}>
          <StatCard
            icon={<CircleCheck size={18} strokeWidth={1.8} />}
            iconColor="#F9FFD0"
            value={`${stats.taken_rate}%`}
            label={t("admin.taken_rate")}
          />
        </div>

        <div
          className="rounded-2xl flex flex-col"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", boxShadow: CARD_SHADOW, padding: 16, gap: 12 }}
        >
          <span className="text-[14px] font-semibold" style={{ color: "var(--color-text)" }}>
            {t("admin.weekly_registrations")}
          </span>
          <div className="flex items-end" style={{ gap: 8, height: 100 }}>
            {stats.weekly_registrations.map((val, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: maxBar > 0 ? `${(val / maxBar) * 100}%` : 0,
                  minHeight: val > 0 ? 4 : 0,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  borderRadius: "6px 6px 0 0",
                }}
              />
            ))}
          </div>
          <div className="flex" style={{ gap: 8 }}>
            {DAYS.map((d) => (
              <span
                key={d}
                className="text-[10px] font-medium"
                style={{ flex: 1, color: "var(--color-text-hint)", textAlign: "center" }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", boxShadow: CARD_SHADOW }}
        >
          <SectionHeader title={t("admin.recent_activity")} />
          {stats.recent_users.map((user, i) => (
            <div key={user.id}>
              {i > 0 && <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />}
              <div className="flex items-center" style={{ gap: 10, height: 52, padding: "0 16px" }}>
                <div
                  className="rounded-full"
                  style={{ width: 32, height: 32, flexShrink: 0, backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate" style={{ color: "var(--color-text)" }}>
                    User #{user.id}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--color-text-hint)" }}>
                    {user.registered_ago} &middot; {user.meds_count} meds
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", boxShadow: CARD_SHADOW }}
        >
          <SectionHeader title={t("admin.user_metrics")} />
          <div className="flex" style={{ height: 64, padding: "0 16px" }}>
            <MetricCell value={stats.dau.toLocaleString()} label="DAU" />
            <MetricCell value={stats.active_users.toLocaleString()} label="WAU (7d)" />
            <MetricCell value={stats.total_users.toLocaleString()} label="MAU (30d)" />
          </div>
          <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="flex" style={{ height: 64, padding: "0 16px" }}>
            <MetricCell value={`+${stats.new_today}`} label="Today" valueColor="#F9FFD0" />
            <MetricCell value={`+${stats.new_week}`} label="This week" valueColor="#F9FFD0" />
            <MetricCell value={`+${stats.new_month}`} label="This month" valueColor="#F9FFD0" />
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", boxShadow: CARD_SHADOW }}
        >
          <SectionHeader title={t("admin.engagement")} />
          <div className="flex" style={{ height: 64, padding: "0 16px" }}>
            <MetricCell value={`${stats.taken_rate}%`} label={t("admin.taken_rate")} valueColor="#F9FFD0" />
            <MetricCell value={stats.avg_pills.toFixed(1)} label="Avg meds/user" />
            <MetricCell value={stats.active_users.toLocaleString()} label="Active (7d)" />
          </div>
        </div>

        {stats.top_medications.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", boxShadow: CARD_SHADOW }}
          >
            <SectionHeader title={t("admin.top_medications")} />
            {stats.top_medications.map((med, i) => (
              <div key={med.name}>
                {i > 0 && <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />}
                <div className="flex items-center" style={{ gap: 8, height: 44, padding: "0 16px" }}>
                  <span className="text-[14px] font-bold" style={{ color: "var(--color-text-hint)" }}>{i + 1}.</span>
                  <span className="flex-1 text-[14px] font-medium" style={{ color: "var(--color-text)" }}>{med.name}</span>
                  <span className="text-[12px] font-medium" style={{ color: "var(--color-text-hint)" }}>{med.users} users</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
