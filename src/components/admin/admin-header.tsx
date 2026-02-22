"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Bell, Sun, Moon, MagnifyingGlass } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// ─── Search Bar ───────────────────────────────────────────────────────────────

function HeaderSearch() {
  return (
    <div className="relative w-full max-w-sm hidden md:flex items-center">
      <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search something..."
        className={cn(
          "w-full pl-9 pr-4 py-2 text-sm rounded-xl transition-all duration-200",
          "bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-card"
        )}
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
        ⌘K
      </kbd>
    </div>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────

function IconButton({
  onClick,
  children,
  badge,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative h-9 w-9 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
      )}
    </button>
  );
}

// ─── User Avatar ──────────────────────────────────────────────────────────────

function HeaderAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-900/30 cursor-pointer">
      <span className="text-xs font-bold text-white">{initials}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    authClient.getSession().then((res) => {
      if (res?.data?.user) {
        setUser({ name: res.data.user.name, email: res.data.user.email });
      }
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center px-6 gap-4 border-b border-border bg-background/80 backdrop-blur-xl">
      <HeaderSearch />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Theme toggle */}
        {mounted && (
          <IconButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </IconButton>
        )}

        {/* Notifications */}
        <IconButton badge>
          <Bell className="h-4 w-4" />
        </IconButton>

        {/* User */}
        {user && <HeaderAvatar name={user.name} />}
      </div>
    </header>
  );
}
