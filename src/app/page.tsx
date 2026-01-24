import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { headers } from "next/headers";
import { Suspense } from "react";
import { GodViewDashboard } from "@/components/admin/god-view-dashboard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { Skeleton } from "@/components/ui/skeleton";

export default async function HomePage() {
  // Check if user is logged in
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userName = session.user.name?.split(" ")[0] || "Admin";

  // User is logged in - show dashboard directly
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-[260px]">
        <AdminHeader />
        <main className="p-6 lg:p-8">
          <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome back, {userName}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here&apos;s what&apos;s happening across your platform today.
                </p>
              </div>
            </div>
            <Suspense fallback={<DashboardSkeleton />}>
              <GodViewDashboard />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}