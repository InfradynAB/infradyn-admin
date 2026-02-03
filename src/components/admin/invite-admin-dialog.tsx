"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteOrganizationAdmin } from "@/lib/actions/super-admin";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface InviteAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  onSuccess?: () => void;
}

export function InviteAdminDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  onSuccess,
}: InviteAdminDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adminEmail: "",
    adminName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await inviteOrganizationAdmin({
      organizationId,
      adminEmail: formData.adminEmail,
      adminName: formData.adminName,
    });

    if (result.success) {
      toast.success(result.message || "Admin invitation sent successfully!");
      setFormData({ adminEmail: "", adminName: "" });
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || "Failed to send invitation");
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Organization Admin</DialogTitle>
          <DialogDescription>
            Invite an Admin to manage <span className="font-medium">{organizationName}</span>. 
            They&apos;ll be able to add PMs, Suppliers, and QA members in the Materials App.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email *</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) =>
                setFormData({ ...formData, adminEmail: e.target.value })
              }
              placeholder="admin@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminName">Admin Name *</Label>
            <Input
              id="adminName"
              value={formData.adminName}
              onChange={(e) =>
                setFormData({ ...formData, adminName: e.target.value })
              }
              placeholder="Jane Smith"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0F6157] hover:bg-[#0d5048]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
