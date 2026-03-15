import { headers } from "next/headers";
import { auth } from "../../../auth";
import { ProfileForm } from "@/components/admin/profile-form";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return null;
  }

  const user = session.user as { name?: string; email?: string };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-64" />}>
        <ProfileForm
          initialName={user.name ?? ""}
          email={user.email ?? ""}
        />
      </Suspense>
    </div>
  );
}
