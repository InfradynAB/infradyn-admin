import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportInbox } from "@/components/admin/support/support-inbox";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-muted-foreground">Manage support tickets across all organizations</p>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <SupportInbox />
      </Suspense>
    </div>
  );
}
