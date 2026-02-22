"use client";

import { useEffect, useState } from "react";
import { listOrganizations, suspendOrganization, activateOrganization } from "@/lib/actions/super-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MagnifyingGlass, DotsThreeVertical, Prohibit, CheckCircle, PencilSimple } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SuspendDialog } from "./suspend-dialog";

type OrganizationType = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  monthlyRevenue: string | null;
  lastActivityAt: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  industry?: string | null;
  size?: string | null;
  contactEmail?: string | null;
};

export function OrganizationsList() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  useEffect(() => {
    const loadOrganizations = async () => {
      setLoading(true);
      const filters: {
        status?: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "DELINQUENT";
        plan?: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
      } = {};

      if (statusFilter !== "all") {
        filters.status = statusFilter as "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "DELINQUENT";
      }
      if (planFilter !== "all") {
        filters.plan = planFilter as "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
      }

      const result = await listOrganizations(filters);
      if (result.success) {
        setOrganizations(result.organizations || []);
      }
      setLoading(false);
    };

    loadOrganizations();
  }, [statusFilter, planFilter]);

  const loadOrganizations = async () => {
    setLoading(true);
    const filters: {
      status?: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "DELINQUENT";
      plan?: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
    } = {};

    if (statusFilter !== "all") {
      filters.status = statusFilter as "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "DELINQUENT";
    }
    if (planFilter !== "all") {
      filters.plan = planFilter as "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
    }

    const result = await listOrganizations(filters);
    if (result.success) {
      setOrganizations(result.organizations || []);
    }
    setLoading(false);
  };

  const handleSuspend = async (org: OrganizationType) => {
    setSelectedOrg(org);
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = async (reason: string) => {
    if (!selectedOrg) return;

    const result = await suspendOrganization(selectedOrg.id, reason);
    if (result.success) {
      toast.success("Organization suspended successfully");
      loadOrganizations();
    } else {
      toast.error(result.error || "Failed to suspend organization");
    }
    setSuspendDialogOpen(false);
    setSelectedOrg(null);
  };

  const handleActivate = async (orgId: string) => {
    const result = await activateOrganization(orgId);
    if (result.success) {
      toast.success("Organization activated successfully");
      loadOrganizations();
    } else {
      toast.error(result.error || "Failed to activate organization");
    }
  };

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="STARTER">Starter</SelectItem>
                <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-sm text-muted-foreground">{org.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        org.status === "ACTIVE"
                          ? "default"
                          : org.status === "SUSPENDED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {org.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${Number(org.monthlyRevenue || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {org.lastActivityAt
                      ? formatDistanceToNow(new Date(org.lastActivityAt), {
                        addSuffix: true,
                      })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <DotsThreeVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/organizations/${org.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/organizations/${org.id}`)}
                        >
                          <PencilSimple className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {org.status === "SUSPENDED" ? (
                          <DropdownMenuItem
                            onClick={() => handleActivate(org.id)}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleSuspend(org)}
                            className="text-red-600"
                          >
                            <Prohibit className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Suspend Dialog */}
      <SuspendDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        onConfirm={handleSuspendConfirm}
        organizationName={selectedOrg?.name || ""}
      />
    </div>
  );
}
