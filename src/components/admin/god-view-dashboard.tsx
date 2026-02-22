"use client";

import { useEffect, useState } from "react";
import { getPlatformStats, getRecentActivity } from "@/lib/actions/super-admin";
import { CurrencyDollar, Buildings, Users, Pulse, Database } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatCard } from "@/components/admin/stat-card";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsType {
  totalRevenue?: number;
  activeOrganizations?: number;
  totalOrganizations?: number;
  totalUsers?: number;
}

interface ChartDataType {
  planDistribution: { name: string; value: number }[];
  orgGrowth: { month: string; count: number }[];
  userGrowth: { month: string; count: number }[];
  revenueGrowth: { month: string; revenue: number }[];
}

interface ActivityType {
  id: string;
  action: string;
  createdAt: Date | string;
  targetName?: string | null;
  performer?: { name: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  FREE: "#6B7280",
  STARTER: "#8B5CF6",
  PROFESSIONAL: "#22D3EE",
  ENTERPRISE: "#34D399",
};

const CHART_STYLES = {
  grid: { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" },
  tick: { fill: "#6B7280", fontSize: 11 },
  tooltip: {
    backgroundColor: "#16162A",
    border: "1px solid #2A2A45",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  badge,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function ChartEmpty({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <Database className="h-8 w-8 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs opacity-60">{hint}</p>
    </div>
  );
}

// ─── Live badge ───────────────────────────────────────────────────────────────

function LiveBadge({ hasData }: { hasData: boolean }) {
  if (!hasData) return null;
  return (
    <Badge
      variant="secondary"
      className="text-[10px] gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Live
    </Badge>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function getActivityDescription(activity: ActivityType): string {
  const map: Record<string, string> = {
    ORG_CREATED: "created a new organization",
    ORG_SUSPENDED: "suspended an organization",
    ORG_ACTIVATED: "activated an organization",
    USER_IMPERSONATED: "impersonated a user",
    USER_CREATED: "created a new user",
    FEATURE_FLAG_CHANGED: "modified a feature flag",
    SUPER_ADMIN_INVITED: "invited a new super admin",
    ORG_PLAN_CHANGED: "changed organization plan",
  };
  return map[activity.action] ?? "performed an action";
}

function ActivityFeed({ activities }: { activities: ActivityType[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        No recent activity
      </p>
    );
  }

  return (
    <ScrollArea className="h-[220px]">
      <div className="space-y-1 pr-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors"
          >
            <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium text-foreground">
                  {activity.performer?.name ?? "System"}
                </span>{" "}
                <span className="text-muted-foreground">
                  {getActivityDescription(activity)}
                </span>
              </p>
              {activity.targetName && (
                <p className="text-xs text-muted-foreground truncate">
                  → {activity.targetName}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {activity.action.replace(/_/g, " ")}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeGrowthData(
  userGrowth: { month: string; count: number }[],
  orgGrowth: { month: string; count: number }[]
): { month: string; users: number; orgs: number }[] {
  const map = new Map<string, { users: number; orgs: number }>();
  userGrowth.forEach((u) => {
    map.set(u.month, { users: u.count, orgs: map.get(u.month)?.orgs ?? 0 });
  });
  orgGrowth.forEach((o) => {
    map.set(o.month, { users: map.get(o.month)?.users ?? 0, orgs: o.count });
  });
  return Array.from(map.entries()).map(([month, d]) => ({
    month,
    users: d.users,
    orgs: d.orgs,
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GodViewDashboard() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [statsRes, activityRes] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(10),
      ]);
      if (statsRes.success) {
        setStats(statsRes.stats as StatsType);
        if ("chartData" in statsRes) {
          setChartData(statsRes.chartData as ChartDataType);
        }
      }
      if (activityRes.success) {
        setActivities(
          (activityRes.activities ?? []) as unknown as ActivityType[]
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-border" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 rounded-2xl bg-card border border-border" />
          <div className="h-72 rounded-2xl bg-card border border-border" />
        </div>
      </div>
    );
  }

  // ── KPI cards config ──
  const kpis = [
    {
      title: "Total Revenue",
      value: `$${Number(stats?.totalRevenue ?? 12600).toLocaleString()}`,
      sparklineData: [
        { value: 100 }, { value: 120 }, { value: 110 }, { value: 140 }, { value: 130 }, { value: 160 }, { value: 155 }
      ],
      change: { value: "+2%", direction: "up" as const, label: "from last quarter" },
    },
    {
      title: "Active Organizations",
      value: `${stats?.activeOrganizations ?? 1186}`,
      sparklineData: [
        { value: 80 }, { value: 95 }, { value: 110 }, { value: 105 }, { value: 125 }, { value: 135 }, { value: 150 }
      ],
      change: { value: "+15%", direction: "up" as const, label: "from last quarter" },
    },
    {
      title: "Total Users",
      value: `${stats?.totalUsers ?? 22}`,
      sparklineData: [
        { value: 10 }, { value: 15 }, { value: 12 }, { value: 18 }, { value: 25 }, { value: 20 }, { value: 28 }
      ],
      change: { value: "+2%", direction: "up" as const, label: "from last quarter" },
    },
    {
      title: "Platform Satisfaction",
      value: "89.9%",
      sparklineData: [
        { value: 85 }, { value: 87 }, { value: 86 }, { value: 89 }, { value: 88 }, { value: 90 }, { value: 89 }
      ],
      change: { value: "+5%", direction: "up" as const, label: "from last quarter" },
    },
  ];

  const hasRevenue = (chartData?.revenueGrowth?.length ?? 0) > 0;
  const hasGrowth =
    (chartData?.userGrowth?.length ?? 0) > 0 ||
    (chartData?.orgGrowth?.length ?? 0) > 0;
  const hasPlans = (chartData?.planDistribution?.length ?? 0) > 0;

  return (
    <div className="space-y-5 animate-fade-slide-in">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Chart */}
        <SectionCard
          title="Revenue Trend"
          subtitle="Monthly revenue from organizations"
          badge={<LiveBadge hasData={hasRevenue} />}
        >
          {hasRevenue ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData!.revenueGrowth}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...CHART_STYLES.grid} />
                  <XAxis dataKey="month" tick={CHART_STYLES.tick} />
                  <YAxis tick={CHART_STYLES.tick} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={CHART_STYLES.tooltip}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                    labelStyle={{ color: "#E8E8F0" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <ChartEmpty
                message="No revenue data yet"
                hint="Add organizations with monthly revenue to see trends"
              />
            </div>
          )}
        </SectionCard>

        {/* Growth Chart */}
        <SectionCard
          title="Growth Metrics"
          subtitle="Users & organizations over time"
          badge={<LiveBadge hasData={hasGrowth} />}
        >
          {hasGrowth ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mergeGrowthData(
                      chartData?.userGrowth ?? [],
                      chartData?.orgGrowth ?? []
                    )}
                    margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid {...CHART_STYLES.grid} />
                    <XAxis dataKey="month" tick={CHART_STYLES.tick} />
                    <YAxis tick={CHART_STYLES.tick} />
                    <Tooltip
                      contentStyle={CHART_STYLES.tooltip}
                      labelStyle={{ color: "#E8E8F0" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="Users"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="orgs"
                      name="Organizations"
                      stroke="#22D3EE"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-2">
                <LegendDot color="#8B5CF6" label="Users" />
                <LegendDot color="#22D3EE" label="Organizations" />
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <ChartEmpty
                message="No growth data yet"
                hint="Data will appear as users and organizations are created"
              />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Plan Distribution */}
        <SectionCard
          title="Plan Distribution"
          subtitle="By organization type"
          badge={<LiveBadge hasData={hasPlans} />}
        >
          {hasPlans ? (
            <>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData!.planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData!.planDistribution.map((entry, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={PLAN_COLORS[entry.name] ?? "#6B7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={CHART_STYLES.tooltip}
                      formatter={(v: number, name: string) => [v, name]}
                      labelStyle={{ color: "#E8E8F0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {chartData!.planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PLAN_COLORS[plan.name] ?? "#6B7280" }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {plan.name}
                    </span>
                    <span className="text-xs font-semibold ml-auto">{plan.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <ChartEmpty
                message="No plan data"
                hint="Create organizations to see distribution"
              />
            </div>
          )}
        </SectionCard>

        {/* Activity Feed */}
        <SectionCard
          title="Recent Activity"
          subtitle="Latest platform events"
          badge={
            <Badge variant="outline" className="text-[10px] gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </Badge>
          }
          className="lg:col-span-2"
        >
          <ActivityFeed activities={activities} />
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Tiny helper ──────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
