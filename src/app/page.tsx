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
    redirect("/login");
  }

  // User is logged in - show dashboard directly
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader />
        <main className="p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
              <p className="text-muted-foreground">
                Monitor the health and performance of the entire INFRADYN platform
              </p>
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
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}