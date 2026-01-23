import { Suspense } from "react";
import { SettingsContent } from "@/components/admin/settings-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage super admin team and platform settings
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
