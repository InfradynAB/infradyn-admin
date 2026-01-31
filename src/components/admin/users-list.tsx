"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MagnifyingGlass, 
  Export, 
  DotsThreeVertical, 
  Copy, 
  UserCircle, 
  Prohibit,
  ArrowsDownUp,
  CaretDown,
  Users,
  CheckCircle,
  Warning,
  EnvelopeSimple,
  Phone,
  UserPlus,
  Clock
} from "@phosphor-icons/react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { searchUsers } from "@/lib/actions/super-admin";
import { generateImpersonationToken } from "@/lib/actions/feature-flags";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "PM" | "SUPPLIER" | "QA" | "SITE_RECEIVER";
  organizationName: string | null;
  organizationId: string | null;
  lastLoginAt: Date | null;
  isSuspended: boolean | null;
  createdAt: Date;
}

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-rose-500",
    "bg-amber-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800";
    case "ADMIN":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800";
    case "PM":
      return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800";
    case "SUPPLIER":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800";
    case "QA":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800";
    case "SITE_RECEIVER":
      return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-teal-200 dark:border-teal-800";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700";
  }
}

function formatRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    PM: "Project Manager",
    SUPPLIER: "Supplier",
    QA: "QA Inspector",
    SITE_RECEIVER: "Site Receiver",
  };
  return roleNames[role] || role;
}

function getAccessLevelInfo(role: string): { level: string; description: string; color: string; bgColor: string } {
  switch (role) {
    case "SUPER_ADMIN":
      return { 
        level: "Full Access", 
        description: "System-wide control",
        color: "text-violet-700 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-900/20"
      };
    case "ADMIN":
      return { 
        level: "Admin Access", 
        description: "Organization admin",
        color: "text-indigo-700 dark:text-indigo-400",
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20"
      };
    case "PM":
      return { 
        level: "Manager Access", 
        description: "Project management",
        color: "text-sky-700 dark:text-sky-400",
        bgColor: "bg-sky-50 dark:bg-sky-900/20"
      };
    case "SUPPLIER":
      return { 
        level: "Vendor Access", 
        description: "Supply chain ops",
        color: "text-amber-700 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20"
      };
    case "QA":
      return { 
        level: "Inspector Access", 
        description: "Quality control",
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20"
      };
    case "SITE_RECEIVER":
      return { 
        level: "Field Access", 
        description: "Site operations",
        color: "text-teal-700 dark:text-teal-400",
        bgColor: "bg-teal-50 dark:bg-teal-900/20"
      };
    default:
      return { 
        level: "Basic Access", 
        description: "Standard user",
        color: "text-slate-700 dark:text-slate-400",
        bgColor: "bg-slate-50 dark:bg-slate-900/20"
      };
  }
}

export function UsersList() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<"name" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load all users on mount
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const result = await searchUsers("");
      if (result.success) {
        setUsers(result.users || []);
      }
      setLoading(false);
    };
    loadUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.organizationName?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  const handleImpersonate = async (userId: string) => {
    const result = await generateImpersonationToken(userId);
    if (result.success && result.magicLink) {
      const impersonationUrl = result.magicLink;
      navigator.clipboard.writeText(impersonationUrl);
      toast.success("Impersonation link copied to clipboard!", {
        description: "Valid for 1 hour. Paste in main app to login as this user.",
      });
    } else {
      toast.error(result.error || "Failed to generate impersonation token");
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Name", "Email", "Organization", "Role", "Access Level", "Status", "Created At"].join(","),
      ...sortedUsers.map((user) =>
        [
          user.name,
          user.email,
          user.organizationName || "N/A",
          formatRoleName(user.role),
          getAccessLevelInfo(user.role).level,
          user.isSuspended ? "Suspended" : "Active",
          format(new Date(user.createdAt), "yyyy-MM-dd"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Users exported successfully!");
  };

  const toggleSort = (field: "name" | "createdAt") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const activeCount = users.filter((u) => !u.isSuspended && (u.organizationId || u.role === "SUPER_ADMIN")).length;
  const suspendedCount = users.filter((u) => u.isSuspended).length;
  
  // Separate users with orgs from those without (pending invitation)
  // Include Super Admins in active users (they don't need orgs)
  // Exclude Super Admins from pending - they don't need org invites
  const activeUsers = sortedUsers.filter((u) => u.organizationId || u.role === "SUPER_ADMIN");
  const pendingUsers = sortedUsers.filter((u) => !u.organizationId && u.role !== "SUPER_ADMIN");
  const pendingCount = users.filter((u) => !u.organizationId && u.role !== "SUPER_ADMIN").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invite</p>
                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold text-amber-600">{suspendedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Warning className="h-5 w-5 text-amber-500" weight="duotone" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Active vs Pending Users */}
      <Tabs defaultValue="active" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Users className="h-4 w-4" />
              Active Users
              <Badge variant="secondary" className="ml-1">{activeUsers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Awaiting Invitation
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-80">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Export className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Success message for filtered results */}
        {search && filteredUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4" weight="fill" />
            {filteredUsers.length} user(s) found matching &quot;{search}&quot;
          </div>
        )}

        {/* Active Users Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card className="overflow-hidden">
            {loading ? (
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse mx-auto" />
                  </div>
                </div>
              </CardContent>
            ) : activeUsers.length === 0 ? (
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-muted-foreground" weight="duotone" />
                  </div>
                  <div>
                    <p className="font-medium">No active users found</p>
                    <p className="text-sm text-muted-foreground">
                      {search ? `No results for "${search}"` : "No users with organizations yet"}
                    </p>
                  </div>
                </div>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">
                        <button
                          onClick={() => toggleSort("name")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Name
                          <ArrowsDownUp className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Organization</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Access Level</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">
                        <button
                          onClick={() => toggleSort("createdAt")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Added on
                          <CaretDown className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            sortField === "createdAt" && sortOrder === "asc" && "rotate-180"
                          )} />
                        </button>
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUsers.map((user) => (
                      <TableRow key={user.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={cn("h-9 w-9", getAvatarColor(user.name))}>
                              <AvatarFallback className="text-white text-xs font-semibold bg-transparent">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {user.organizationName || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn("font-medium", getRoleBadgeStyle(user.role))}
                          >
                            {formatRoleName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "inline-flex flex-col px-2.5 py-1 rounded-md",
                            getAccessLevelInfo(user.role).bgColor
                          )}>
                            <span className={cn("text-sm font-medium", getAccessLevelInfo(user.role).color)}>
                              {getAccessLevelInfo(user.role).level}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getAccessLevelInfo(user.role).description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isSuspended ? (
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              <span className="text-amber-600 dark:text-amber-400 text-sm">Suspended</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-green-600 dark:text-green-400 text-sm">Active</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.createdAt), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <DotsThreeVertical className="h-4 w-4" weight="bold" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleImpersonate(user.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Impersonate Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Prohibit className="mr-2 h-4 w-4" />
                                {user.isSuspended ? "Unsuspend User" : "Suspend User"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
          
          {/* Footer info */}
          {activeUsers.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Showing {activeUsers.length} active users
            </div>
          )}
        </TabsContent>

        {/* Pending Users Tab */}
        <TabsContent value="pending" className="space-y-4">
          {/* Alert banner */}
          {pendingUsers.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" weight="duotone" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-300">
                  {pendingUsers.length} user(s) awaiting invitation
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  These users signed up without an invitation link. They need to be contacted and invited to an organization.
                </p>
              </div>
            </div>
          )}
          
          <Card className="overflow-hidden">
            {loading ? (
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse mx-auto" />
                  </div>
                </div>
              </CardContent>
            ) : pendingUsers.length === 0 ? (
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" weight="duotone" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">All clear!</p>
                    <p className="text-sm text-muted-foreground">
                      No pending users awaiting invitation
                    </p>
                  </div>
                </div>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50/50">
                      <TableHead className="font-semibold">
                        <button
                          onClick={() => toggleSort("name")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Name
                          <ArrowsDownUp className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Requested Role</TableHead>
                      <TableHead className="font-semibold">
                        <button
                          onClick={() => toggleSort("createdAt")}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Signed Up
                          <CaretDown className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            sortField === "createdAt" && sortOrder === "asc" && "rotate-180"
                          )} />
                        </button>
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id} className="group bg-orange-50/30 dark:bg-orange-900/5">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className={cn("h-9 w-9", getAvatarColor(user.name))}>
                              <AvatarFallback className="text-white text-xs font-semibold bg-transparent">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{user.name}</span>
                              <p className="text-xs text-muted-foreground">No organization</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{user.email}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(user.email);
                                toast.success("Email copied!");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn("font-medium", getRoleBadgeStyle(user.role))}
                          >
                            {formatRoleName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(user.createdAt), "dd/MM/yyyy")}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(user.createdAt), "HH:mm")}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                              Needs Invite
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(user.email);
                                toast.success("Email copied!", {
                                  description: user.email
                                });
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy Email
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => {
                                toast.info("Send invitation feature coming soon", {
                                  description: "You can email the user for now to get their organization details."
                                });
                              }}
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                              Send Invite
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                >
                                  <DotsThreeVertical className="h-4 w-4" weight="bold" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleImpersonate(user.id)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copy Impersonate Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Prohibit className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
          
          {/* Footer info */}
          {pendingUsers.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Showing {pendingUsers.length} pending users awaiting invitation
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
