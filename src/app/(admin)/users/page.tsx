import { Suspense } from "react";
import { UsersList } from "@/components/admin/users-list";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Search and manage all users across organizations
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <UsersList />
      </Suspense>
    </div>
  );
}
