import { Suspense } from "react";
import { OrganizationsList } from "@/components/admin/organizations-list";
import { CreateOrganizationDialog } from "@/components/admin/create-organization-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage all organizations on the platform
          </p>
        </div>
        <CreateOrganizationDialog>
          <Button className="bg-[#0F6157] hover:bg-[#0d5048]">
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </CreateOrganizationDialog>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <OrganizationsList />
      </Suspense>
    </div>
  );
}
