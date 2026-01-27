import { Suspense } from "react";
import { UsersList } from "@/components/admin/users-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage all users across organizations
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-12" />
          <Skeleton className="h-96" />
        </div>
      }>
        <UsersList />
      </Suspense>
    </div>
  );
}
