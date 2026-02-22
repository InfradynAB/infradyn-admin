"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SquaresFour,
  Buildings,
  Users,
  Flag,
  ListBullets,
  Gear,
  SignOut,
} from "@phosphor-icons/react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Nav config ──────────────────────────────────────────────────────────────
const mainNav = [
  { name: "Dashboard", href: "/", icon: SquaresFour },
  { name: "Organizations", href: "/organizations", icon: Buildings },
  { name: "Users", href: "/users", icon: Users },
];

const systemNav = [
  { name: "Feature Flags", href: "/feature-flags", icon: Flag },
  { name: "Audit Logs", href: "/audit-logs", icon: ListBullets },
  { name: "Settings", href: "/admin-settings", icon: Gear },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-5 h-[64px] border-b border-sidebar-border shrink-0">
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-900/40">
        <span className="text-base font-bold text-white">I</span>
      </div>
      <div>
        <h1 className="font-bold text-[13px] tracking-widest text-sidebar-foreground uppercase leading-none">
          Infradyn
        </h1>
        <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest mt-0.5">
          Admin Portal
        </p>
      </div>
    </div>
  );
}

interface NavGroupProps {
  label: string;
  items: { name: string; href: string; icon: React.ElementType }[];
  pathname: string;
}

function NavGroup({ label, items, pathname }: NavGroupProps) {
  return (
    <div className="space-y-0.5">
      <p className="px-4 mb-1.5 text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest">
        {label}
      </p>
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
              isActive
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center h-[30px] w-[30px] rounded-lg transition-all duration-200",
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-800/50"
                  : "bg-sidebar-accent/60 text-sidebar-foreground/40 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <span className="flex-1">{item.name}</span>
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

interface UserCardProps {
  name: string;
  email: string;
  onSignOut: () => void;
}

function UserCard({ name, email, onSignOut }: UserCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="m-3 p-3 rounded-xl bg-sidebar-accent/40 border border-sidebar-border">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shrink-0 shadow-md shadow-violet-900/30">
          <span className="text-xs font-bold text-white">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-sidebar-foreground truncate">
            {name}
          </p>
          <p className="text-[10px] text-sidebar-foreground/40 truncate">
            {email}
          </p>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="mt-2.5 flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] font-medium text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-red-400 transition-all duration-200 group"
      >
        <SignOut className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" />
        Sign Out
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );

  useEffect(() => {
    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setUser({
          name: res.data.user.name,
          email: res.data.user.email,
        });
      }
    });
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-[240px] bg-sidebar hidden lg:flex lg:flex-col">
      <SidebarLogo />

      {/* Nav */}
      <nav className="flex-1 px-1 py-5 space-y-5 overflow-y-auto">
        <NavGroup label="Main Menu" items={mainNav} pathname={pathname} />
        <NavGroup label="System" items={systemNav} pathname={pathname} />
      </nav>

      {/* User */}
      {user && (
        <UserCard
          name={user.name}
          email={user.email}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
