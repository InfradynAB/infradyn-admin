"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  DollarSign, 
  Calendar, 
  Mail, 
  Phone, 
  Globe,
  Ban,
  CheckCircle,
  Pencil,
  UserPlus,
  Info,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { suspendOrganization, activateOrganization } from "@/lib/actions/super-admin";
import { toast } from "sonner";
import { SuspendDialog } from "./suspend-dialog";
import { EditOrganizationDialog } from "./edit-organization-dialog";
import { InviteAdminDialog } from "./invite-admin-dialog";

interface OrganizationDetailProps {
  organization: any;
  members: any[];
  userCount: number;
}

export function OrganizationDetail({ organization, members, userCount }: OrganizationDetailProps) {
  const router = useRouter();
  const [org, setOrg] = useState(organization);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteAdminDialogOpen, setInviteAdminDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    const result = await activateOrganization(org.id);
    if (result.success) {
      toast.success("Organization activated successfully");
      setOrg({ ...org, status: "ACTIVE" });
    } else {
      toast.error(result.error || "Failed to activate organization");
    }
    setLoading(false);
  };

  const handleSuspendConfirm = async (reason: string) => {
    setLoading(true);
    const result = await suspendOrganization(org.id, reason);
    if (result.success) {
      toast.success("Organization suspended successfully");
      setOrg({ ...org, status: "SUSPENDED" });
    } else {
      toast.error(result.error || "Failed to suspend organization");
    }
    setLoading(false);
    setSuspendDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
              <Badge
                variant={
                  org.status === "ACTIVE" ? "default" :
                  org.status === "SUSPENDED" ? "destructive" : "secondary"
                }
              >
                {org.status}
              </Badge>
              <Badge variant="outline">{org.plan}</Badge>
            </div>
            <p className="text-muted-foreground">{org.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setInviteAdminDialogOpen(true)}
            className="border-[#0F6157] text-[#0F6157] hover:bg-[#0F6157]/10"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Admin
          </Button>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          {org.status === "SUSPENDED" ? (
            <Button onClick={handleActivate} disabled={loading} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Activate
            </Button>
          ) : (
            <Button 
              variant="destructive" 
              onClick={() => setSuspendDialogOpen(true)} 
              disabled={loading}
            >
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(org.monthlyRevenue || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.plan}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {org.lastActivityAt
                ? formatDistanceToNow(new Date(org.lastActivityAt), { addSuffix: true })
                : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">{org.industry || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Company Size</p>
                <p className="font-medium">{org.size || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Contact Email</p>
                <p className="font-medium">{org.contactEmail || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{org.phone || "Not specified"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <p className="font-medium">{org.website || "Not specified"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {org.createdAt ? format(new Date(org.createdAt), "PPpp") : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {org.updatedAt ? format(new Date(org.updatedAt), "PPpp") : "Unknown"}
              </p>
            </div>
            {org.suspendedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Suspended At</p>
                <p className="font-medium text-red-600">
                  {format(new Date(org.suspendedAt), "PPpp")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>All users in this organization (read-only)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-sky-50 border-sky-200">
            <Info className="h-4 w-4 text-sky-600" />
            <AlertDescription className="text-sky-800">
              <span className="font-medium">Delegated Admin Model:</span> You can invite Admins from here. 
              PMs, Suppliers, and QA team members are managed by Organization Admins in the{" "}
              <a 
                href={process.env.MAIN_APP_URL || "https://materials.infradyn.com"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium underline hover:text-sky-900"
              >
                Materials App
              </a>.
            </AlertDescription>
          </Alert>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.isSuspended ? "destructive" : "default"}>
                        {member.isSuspended ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.lastLoginAt
                        ? formatDistanceToNow(new Date(member.lastLoginAt), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <SuspendDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        onConfirm={handleSuspendConfirm}
        organizationName={org.name}
      />
      <EditOrganizationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        organization={org}
        onSuccess={(updated) => setOrg({ ...org, ...updated })}
      />
      <InviteAdminDialog
        open={inviteAdminDialogOpen}
        onOpenChange={setInviteAdminDialogOpen}
        organizationId={org.id}
        organizationName={org.name}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
