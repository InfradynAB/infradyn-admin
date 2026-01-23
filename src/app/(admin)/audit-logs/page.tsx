import { Suspense } from "react";
import { AuditLogsList } from "@/components/admin/audit-logs-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all administrative actions across the platform
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <AuditLogsList />
      </Suspense>
    </div>
  );
}
