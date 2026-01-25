"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, User as UserIcon, Copy, Loader2 } from "lucide-react";
import { searchUsers } from "@/lib/actions/super-admin";
import { generateImpersonationToken } from "@/lib/actions/feature-flags";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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

export function UsersList() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSearch = async () => {
    setLoading(true);
    const result = await searchUsers(search);
    if (result.success) {
      setUsers(result.users || []);
    } else {
      toast.error(result.error || "Failed to search users");
    }
    setLoading(false);
  };

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

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or organization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-[#0F6157] hover:bg-[#0d5048]"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        {loading ? (
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </CardContent>
        ) : users.length === 0 ? (
          <CardContent className="py-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search ? `No users found matching "${search}"` : "No users found"}
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{user.organizationName || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isSuspended ? "destructive" : "default"}
                    >
                      {user.isSuspended ? "Suspended" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt 
                      ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImpersonate(user.id)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Impersonate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
