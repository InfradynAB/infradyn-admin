"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Warning } from "@phosphor-icons/react";

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  organizationName: string;
}

export function SuspendDialog({
  open,
  onOpenChange,
  onConfirm,
  organizationName,
}: SuspendDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onConfirm(reason);
    setReason("");
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Warning className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Suspend Organization</DialogTitle>
              <DialogDescription>
                This will block all users in <strong>{organizationName}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> Suspending this organization will:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-red-700">
              <li>Block all users from logging in</li>
              <li>Disable all API access</li>
              <li>Pause any scheduled jobs</li>
              <li>Show a suspension notice to users</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Suspension Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for suspension (required)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be logged in the audit trail and may be visible to the organization.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
          >
            {loading ? "Suspending..." : "Suspend Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
