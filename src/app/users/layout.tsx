import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default function UsersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-[260px]">
        <AdminHeader />
        <main className="p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
