"use client";

import { useEffect, useState } from "react";
import { getRecentActivity } from "@/lib/actions/super-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { DownloadSimple } from "@phosphor-icons/react";

export function AuditLogsList() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    const loadLogs = async () => {
      const result = await getRecentActivity(100);
      if (result.success) {
        setLogs(result.activities || []);
      }
      setLoading(false);
    };

    loadLogs();
  }, []);

  const filteredLogs = actionFilter === "all"
    ? logs
    : logs.filter((log) => log.action === actionFilter);

  const exportToCSV = () => {
    const csv = [
      ["Timestamp", "Action", "Performer", "Target Type", "Target Name", "IP Address"].join(","),
      ...filteredLogs.map((log) =>
        [
          format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
          log.action,
          log.performer?.name || "System",
          log.targetType || "",
          log.targetName || "",
          log.ipAddress || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="ORG_CREATED">Organization Created</SelectItem>
                  <SelectItem value="ORG_SUSPENDED">Organization Suspended</SelectItem>
                  <SelectItem value="ORG_ACTIVATED">Organization Activated</SelectItem>
                  <SelectItem value="USER_IMPERSONATED">User Impersonated</SelectItem>
                  <SelectItem value="FEATURE_FLAG_CHANGED">Feature Flag Changed</SelectItem>
                  <SelectItem value="SUPER_ADMIN_INVITED">Super Admin Invited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={exportToCSV}>
              <DownloadSimple className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Performer</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.performer?.name || "System"}</TableCell>
                  <TableCell>
                    <div>
                      {log.targetType && (
                        <p className="text-sm text-muted-foreground">
                          {log.targetType}
                        </p>
                      )}
                      {log.targetName && (
                        <p className="text-sm font-medium">{log.targetName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.ipAddress || "N/A"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
