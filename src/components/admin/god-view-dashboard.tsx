"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformStats, getRecentActivity } from "@/lib/actions/super-admin";
import { DollarSign, Building2, Users, Activity, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GodViewDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [statsRes, activityRes] = await Promise.all([
        getPlatformStats(),
        getRecentActivity(50),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (activityRes.success) {
        setActivities(activityRes.activities || []);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const kpis = [
    {
      title: "Total MRR",
      value: `$${Number(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      description: "Monthly Recurring Revenue",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Organizations",
      value: `${stats?.activeOrganizations || 0}/${stats?.totalOrganizations || 0}`,
      icon: Building2,
      description: "Active in last 7 days",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Across all organizations",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "System Health",
      value: "🟢 Healthy",
      icon: Activity,
      description: "All systems operational",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth Chart Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p className="text-muted-foreground">Chart placeholder - Integrate with recharts</p>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent actions across all organizations
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {activity.action.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.performer?.name}</span>{" "}
                        {getActivityDescription(activity)}
                      </p>
                      {activity.targetName && (
                        <p className="text-sm text-muted-foreground">
                          Target: {activity.targetName}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function getActivityDescription(activity: any): string {
  switch (activity.action) {
    case "ORG_CREATED":
      return "created a new organization";
    case "ORG_SUSPENDED":
      return "suspended an organization";
    case "ORG_ACTIVATED":
      return "activated an organization";
    case "USER_IMPERSONATED":
      return "impersonated a user";
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
