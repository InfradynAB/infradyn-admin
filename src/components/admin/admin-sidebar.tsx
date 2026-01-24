"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Flag,
  ScrollText,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Organizations", href: "/organizations", icon: Building2 },
  { name: "Users", href: "/users", icon: Users },
  { name: "Feature Flags", href: "/feature-flags", icon: Flag },
  { name: "Audit Logs", href: "/audit-logs", icon: ScrollText },
  { name: "Settings", href: "/admin-settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar border-r border-sidebar-border hidden lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-xl bg-linear-to-br from-[#0F6157] to-[#0d5048] flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-white">I</span>
        </div>
        <div>
          <h1 className="font-bold text-sidebar-foreground tracking-tight">INFRADYN</h1>
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
          Menu
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#0F6157] text-white shadow-lg shadow-[#0F6157]/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn(
                "h-[18px] w-[18px] transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )} />
              <span className="flex-1">{item.name}</span>
              {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 w-full group"
        >
          <LogOut className="h-[18px] w-[18px] group-hover:scale-110 transition-transform duration-200" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
