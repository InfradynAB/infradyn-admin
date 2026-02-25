"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  addTicketReply,
  assignTicket,
  getTicketWithThread,
  listSupportAssignees,
  updateTicketStatus,
  type TicketStatus,
  type TicketWithThread,
} from "@/lib/actions/support-actions";
import { CategoryBadge, PriorityBadge, StatusBadge } from "./support-badges";

const transitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["AWAITING_USER", "RESOLVED", "CLOSED"],
  AWAITING_USER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "OPEN"],
  CLOSED: [],
};

function canTransition(from: TicketStatus, to: TicketStatus) {
  return from === to || transitions[from].includes(to);
}

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<TicketWithThread | null>(null);
  const [assignees, setAssignees] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusOptions = useMemo(() => {
    if (!ticket) return [] as TicketStatus[];
    return ["OPEN", "IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"] as TicketStatus[];
  }, [ticket]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([getTicketWithThread(ticketId), listSupportAssignees()]);
      setTicket(t);
      setAssignees(a);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleUpload = async (fileToUpload: File) => {
    const res = await fetch("/api/support/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: fileToUpload.name,
        contentType: fileToUpload.type,
        fileSize: fileToUpload.size,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Upload init failed");
    }

    const data = (await res.json()) as { uploadUrl: string; fileUrl: string };
    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": fileToUpload.type },
      body: fileToUpload,
    });

    if (!put.ok) {
      throw new Error("Upload failed");
    }

    return data.fileUrl;
  };

  const submitReply = async () => {
    if (!ticket) return;
    if (!reply.trim()) {
      toast.error("Message is required");
      return;
    }
    if (ticket.status === "CLOSED") {
      toast.error("Ticket is closed");
      return;
    }

    setPosting(true);
    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentType: string | null = null;

      if (file) {
        attachmentUrl = await handleUpload(file);
        attachmentName = file.name;
        attachmentType = file.type;
      }

      const fd = new FormData();
      fd.set("ticketId", ticket.id);
      fd.set("content", reply);
      fd.set("isInternal", isInternal ? "true" : "false");
      if (attachmentUrl) fd.set("attachmentUrl", attachmentUrl);
      if (attachmentName) fd.set("attachmentName", attachmentName);
      if (attachmentType) fd.set("attachmentType", attachmentType);

      const result = await addTicketReply(fd);
      if (!result.success) {
        toast.error(result.error || "Failed to post reply");
        return;
      }

      toast.success(isInternal ? "Internal note added" : "Reply posted");
      setReply("");
      setIsInternal(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to post reply");
    } finally {
      setPosting(false);
    }
  };

  const setStatus = async (status: TicketStatus) => {
    if (!ticket) return;
    if (!canTransition(ticket.status, status)) {
      toast.error(`Invalid transition: ${ticket.status} → ${status}`);
      return;
    }
    const result = await updateTicketStatus(ticket.id, status);
    if (!result.success) {
      toast.error(result.error || "Failed to update status");
      return;
    }
    toast.success("Status updated");
    await refresh();
  };

  const setAssignee = async (userId: string) => {
    if (!ticket) return;
    const result = await assignTicket(ticket.id, userId);
    if (!result.success) {
      toast.error(result.error || "Failed to assign");
      return;
    }
    toast.success("Assigned");
    await refresh();
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!ticket) {
    return <div className="text-muted-foreground">Ticket not found</div>;
  }

  const openedAt = ticket.createdAt ? format(ticket.createdAt, "PPP p") : "—";
  const lastActivity = ticket.lastActivityAt
    ? formatDistanceToNow(ticket.lastActivityAt, { addSuffix: true })
    : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Thread */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{ticket.ticketNumber}</span>
              <span className="text-base font-semibold">{ticket.subject}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <CategoryBadge category={ticket.category} />
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <span className="text-sm text-muted-foreground">Opened {openedAt}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Raised by <span className="font-medium text-foreground">{ticket.raiser?.name || "Unknown"}</span>
              {ticket.raiser?.email ? <span className="text-muted-foreground"> · {ticket.raiser.email}</span> : null}
            </div>
            <div className="text-sm text-muted-foreground">
              Organisation: <span className="text-foreground">{ticket.organization?.name || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Original description */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Original description</div>
            <div className="rounded-lg border bg-muted/50 p-4 whitespace-pre-wrap">
              {ticket.description}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            {ticket.messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">No messages yet</div>
            ) : (
              ticket.messages.map((m) => {
                const align = m.isFromSupport ? "justify-end" : "justify-start";
                const bubble = m.isInternal
                  ? "bg-amber-500/10 border-amber-500/20"
                  : m.isFromSupport
                    ? "bg-primary/10 border-primary/20"
                    : "bg-muted/50";

                return (
                  <div key={m.id} className={cn("flex", align)}>
                    <div className={cn("max-w-[85%] rounded-lg border p-3", bubble)}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium">
                          {m.isInternal ? "Internal Note" : m.sender?.name || m.sender?.email || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.createdAt ? format(m.createdAt, "PP p") : ""}
                        </div>
                      </div>
                      <div className="mt-2 text-sm whitespace-pre-wrap">{m.content}</div>
                      {m.attachmentUrl ? (
                        <div className="mt-3">
                          {m.attachmentType?.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.attachmentUrl}
                              alt={m.attachmentName || "attachment"}
                              className="max-h-64 rounded-md border"
                            />
                          ) : (
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm underline"
                            >
                              Download attachment
                            </a>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Reply form */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[120px]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="max-w-[320px]"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept="image/*,application/pdf"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isInternal}
                    onCheckedChange={(v) => setIsInternal(Boolean(v))}
                    id="internal-note"
                  />
                  <label htmlFor="internal-note" className="text-sm text-muted-foreground">
                    Mark as Internal Note
                  </label>
                </div>
              </div>

              <Button onClick={submitReply} disabled={posting || ticket.status === "CLOSED"}>
                {posting ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <Select value={ticket.status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s} disabled={!canTransition(ticket.status, s)}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Assign to</div>
              <Select value={ticket.assignedTo || ""} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name || a.email} ({a.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Opened</span>
                  <span>{openedAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last activity</span>
                  <span>{lastActivity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span>{ticket.resolvedAt ? format(ticket.resolvedAt, "PPP") : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total messages</span>
                  <span>{ticket.messages.length}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setStatus("RESOLVED")}
                disabled={!canTransition(ticket.status, "RESOLVED")}
              >
                Mark Resolved
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={!canTransition(ticket.status, "CLOSED")}
                  >
                    Close Ticket
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Close this ticket?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Closed tickets are terminal. Users must raise a new ticket for further help.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setStatus("CLOSED")}>Close</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
