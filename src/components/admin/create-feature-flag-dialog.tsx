"use client";

import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFeatureFlag } from "@/lib/actions/feature-flags";
import { toast } from "sonner";
import { CircleNotch } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

export function CreateFeatureFlagDialog({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createFeatureFlag({ ...formData, isEnabled: false });

    if (result.success) {
      toast.success("Feature flag created successfully!");
      setOpen(false);
      setFormData({ name: "", key: "", description: "" });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create feature flag");
    }

    setLoading(false);
  };

  const generateKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Feature Flag</DialogTitle>
          <DialogDescription>
            Add a new feature flag to control feature rollout
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Feature Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  name: e.target.value,
                  key: generateKey(e.target.value),
                });
              }}
              placeholder="AI Document Extraction"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">Key *</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="AI_DOCUMENT_EXTRACTION"
              required
            />
            <p className="text-xs text-muted-foreground">
              Used in code to check if feature is enabled
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enable AI-powered document extraction for invoices"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
                  <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Flag"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
