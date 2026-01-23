"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteSuperAdmin } from "@/lib/actions/super-admin";
import { toast } from "sonner";
import { Mail, Shield } from "lucide-react";

export function SettingsContent() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await inviteSuperAdmin(inviteEmail);

    if (result.success) {
      toast.success("Invitation sent successfully!");
      setInviteEmail("");
    } else {
      toast.error(result.error || "Failed to send invitation");
    }

    setLoading(false);
  };

  return (
    <div className="grid gap-6">
      {/* Super Admin Team */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#0F6157]" />
            <CardTitle>Super Admin Team</CardTitle>
          </div>
          <CardDescription>
            Invite additional Infradyn staff to the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@infradyn.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button
                  type="submit"
                  className="bg-[#0F6157] hover:bg-[#0d5048]"
                  disabled={loading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-4">Current Team</h4>
            <p className="text-sm text-muted-foreground">
              Team management interface coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>
            Configure platform-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Additional settings will be added here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
