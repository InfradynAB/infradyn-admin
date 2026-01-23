import { Suspense } from "react";
import { FeatureFlagsList } from "@/components/admin/feature-flags-list";
import { CreateFeatureFlagDialog } from "@/components/admin/create-feature-flag-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
          <p className="text-muted-foreground">
            Control feature rollout across organizations
          </p>
        </div>
        <CreateFeatureFlagDialog>
          <Button className="bg-[#0F6157] hover:bg-[#0d5048]">
            <Plus className="mr-2 h-4 w-4" />
            Create Flag
          </Button>
        </CreateFeatureFlagDialog>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <FeatureFlagsList />
      </Suspense>
    </div>
  );
}
