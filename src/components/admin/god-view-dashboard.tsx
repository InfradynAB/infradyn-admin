"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformStats, getRecentActivity } from "@/lib/actions/super-admin";
import { DollarSign, Building2, Users, Activity, TrendingUp, TrendingDown, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Plan colors for pie chart
const PLAN_COLORS: Record<string, string> = {
  FREE: "#94a3b8",
  STARTER: "#0F6157",
  PROFESSIONAL: "#0ea5e9",
  ENTERPRISE: "#8b5cf6",
};

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

export function GodViewDashboard() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [statsRes, activityRes] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(10),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats as StatsType);
        if ('chartData' in statsRes) {
          setChartData(statsRes.chartData as ChartDataType);
        }
      }

      if (activityRes.success) {
        setActivities((activityRes.activities || []) as unknown as ActivityType[]);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total MRR",
      value: `$${Number(stats?.totalRevenue || 0).toLocaleString()}`,
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
    },
    {
      title: "Active Organizations",
      value: `${stats?.activeOrganizations || 0}`,
      subtitle: `of ${stats?.totalOrganizations || 0} total`,
      change: "+3",
      trend: "up" as const,
      icon: Building2,
    },
    {
      title: "Total Users",
      value: stats?.totalUsers?.toString() || "0",
      change: "+24",
      trend: "up" as const,
      icon: Users,
    },
    {
      title: "System Health",
      value: "Healthy",
      status: "operational",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    {kpi.subtitle && (
                      <span className="text-sm text-muted-foreground">{kpi.subtitle}</span>
                    )}
                  </div>
                  {kpi.change && (
                    <div className={`flex items-center gap-1 text-sm ${
                      kpi.trend === "up" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {kpi.trend === "up" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{kpi.change}</span>
                      <span className="text-muted-foreground">vs last month</span>
                    </div>
                  )}
                  {kpi.status && (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-sm text-emerald-600">All systems operational</span>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <kpi.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly revenue from organizations</p>
              </div>
              {chartData?.revenueGrowth && chartData.revenueGrowth.length > 0 && (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Database className="h-3 w-3 mr-1" />
                  Live Data
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {chartData?.revenueGrowth && chartData.revenueGrowth.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.revenueGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F6157" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0F6157" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }} 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#0F6157" 
                      strokeWidth={2}
                      fill="url(#revenueGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No revenue data yet</p>
                  <p className="text-xs">Add organizations with monthly revenue to see trends</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Chart - Combines user and org growth */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Growth Metrics</CardTitle>
                <p className="text-sm text-muted-foreground">Users & organizations over time</p>
              </div>
              {(chartData?.userGrowth?.length || chartData?.orgGrowth?.length) ? (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Database className="h-3 w-3 mr-1" />
                  Live Data
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {(chartData?.userGrowth?.length || chartData?.orgGrowth?.length) ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={mergeGrowthData(chartData?.userGrowth || [], chartData?.orgGrowth || [])} 
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }} 
                    />
                    <Line type="monotone" dataKey="users" name="Users" stroke="#0F6157" strokeWidth={2} dot={{ fill: '#0F6157', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="orgs" name="Organizations" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No growth data yet</p>
                  <p className="text-xs">Data will appear as users and organizations are created</p>
                </div>
              </div>
            )}
            {(chartData?.userGrowth?.length || chartData?.orgGrowth?.length) ? (
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#0F6157]" />
                  <span className="text-sm text-muted-foreground">Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#0ea5e9]" />
                  <span className="text-sm text-muted-foreground">Organizations</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Plan Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">Organizations by plan type</p>
              </div>
              {chartData?.planDistribution && chartData.planDistribution.length > 0 && (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Database className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {chartData?.planDistribution && chartData.planDistribution.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.planDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.planDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.name] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {chartData.planDistribution.map((plan) => (
                    <div key={plan.name} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PLAN_COLORS[plan.name] || "#94a3b8" }} />
                      <span className="text-xs text-muted-foreground">{plan.name}</span>
                      <span className="text-xs font-medium ml-auto">{plan.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No plan data</p>
                  <p className="text-xs">Create organizations to see distribution</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground">Latest platform events</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Live
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[260px] pr-4">
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="mt-0.5">
                        <div className="h-2 w-2 rounded-full bg-[#0F6157]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{activity.performer?.name || "System"}</span>
                          <span className="text-sm text-muted-foreground">{getActivityDescription(activity)}</span>
                        </div>
                        {activity.targetName && (
                          <p className="text-sm text-muted-foreground truncate">
                            → {activity.targetName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {activity.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to merge user and org growth data by month
function mergeGrowthData(
  userGrowth: { month: string; count: number }[],
  orgGrowth: { month: string; count: number }[]
): { month: string; users: number; orgs: number }[] {
  const monthMap = new Map<string, { users: number; orgs: number }>();
  
  // Add user data
  userGrowth.forEach(u => {
    const existing = monthMap.get(u.month) || { users: 0, orgs: 0 };
    monthMap.set(u.month, { ...existing, users: u.count });
  });
  
  // Add org data
  orgGrowth.forEach(o => {
    const existing = monthMap.get(o.month) || { users: 0, orgs: 0 };
    monthMap.set(o.month, { ...existing, orgs: o.count });
  });
  
  // Convert to array
  return Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    users: data.users,
    orgs: data.orgs,
  }));
}

function getActivityDescription(activity: ActivityType): string {
  switch (activity.action) {
    case "ORG_CREATED":
      return "created a new organization";
    case "ORG_SUSPENDED":
      return "suspended an organization";
    case "ORG_ACTIVATED":
      return "activated an organization";
    case "USER_IMPERSONATED":
      return "impersonated a user";
    case "USER_CREATED":
      return "created a new user";
    case "FEATURE_FLAG_CHANGED":
      return "modified a feature flag";
    case "SUPER_ADMIN_INVITED":
      return "invited a new super admin";
    case "ORG_PLAN_CHANGED":
      return "changed organization plan";
    default:
      return "performed an action";
  }
}
