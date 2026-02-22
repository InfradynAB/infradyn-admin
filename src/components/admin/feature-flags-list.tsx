"use client";

import { useEffect, useState } from "react";
import { listFeatureFlags, toggleFeatureFlag } from "@/lib/actions/feature-flags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gear } from "@phosphor-icons/react";
import { toast } from "sonner";

export function FeatureFlagsList() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlags = async () => {
    const result = await listFeatureFlags();
    if (result.success) {
      setFlags(result.flags || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (key: string, currentState: boolean) => {
    const result = await toggleFeatureFlag(key, !currentState);
    if (result.success) {
      toast.success(`Feature flag ${!currentState ? "enabled" : "disabled"}`);
      loadFlags();
    } else {
      toast.error(result.error || "Failed to toggle feature flag");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {flags.length === 0 ? (
        <Card className="col-span-2">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No feature flags yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{flag.name}</CardTitle>
                  <CardDescription>{flag.description}</CardDescription>
                  <Badge variant="outline" className="mt-2">
                    {flag.key}
                  </Badge>
                </div>
                <Switch
                  checked={flag.isEnabled}
                  onCheckedChange={() => handleToggle(flag.key, flag.isEnabled)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  {flag.enabledForOrgs?.length > 0 && (
                    <p className="text-muted-foreground">
                      Enabled for {flag.enabledForOrgs.length} org(s)
                    </p>
                  )}
                  {flag.disabledForOrgs?.length > 0 && (
                    <p className="text-muted-foreground">
                      Disabled for {flag.disabledForOrgs.length} org(s)
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
