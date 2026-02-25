"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  getAllTickets,
  getSupportStats,
  type TicketListItem,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/actions/support-actions";
import { CategoryBadge, PriorityBadge, StatusBadge } from "./support-badges";

type SortKey = "lastActivityAt" | "createdAt" | "priority";

const statusTabs: { label: string; value: "ALL" | TicketStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Awaiting User", value: "AWAITING_USER" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

const priorityRank: Record<TicketPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function SupportInbox() {
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof statusTabs)[number]["value"]>("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastActivityAt");
  const [stats, setStats] = useState<{[k: string]: number} | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [t, s] = await Promise.all([getAllTickets(), getSupportStats()]);
        setTickets(t);
        setStats(s);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load support tickets");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = tickets;
    if (tab !== "ALL") {
      items = items.filter((t) => t.status === tab);
    }
    if (q) {
      items = items.filter((t) =>
        t.ticketNumber.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
      );
    }

    const sorted = [...items];
    sorted.sort((a, b) => {
      if (sortKey === "createdAt") {
        return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      }
      if (sortKey === "priority") {
        return priorityRank[b.priority] - priorityRank[a.priority];
      }
      return (b.lastActivityAt?.getTime() || 0) - (a.lastActivityAt?.getTime() || 0);
    });

    return sorted;
  }, [tickets, tab, search, sortKey]);

  const statCard = (label: string, value: number, className?: string) => (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("text-lg font-semibold", className)}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {statCard("Open", stats?.open ?? 0, "text-destructive")}
            {statCard("In Progress", stats?.in_progress ?? 0, "text-blue-600")}
            {statCard("Awaiting", stats?.awaiting_user ?? 0, "text-amber-600")}
            {statCard("Resolved", stats?.resolved ?? 0, "text-emerald-700")}
            {statCard("Closed", stats?.closed ?? 0, "text-muted-foreground")}
            {statCard("Urgent", stats?.urgent ?? 0, "text-destructive")}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="flex flex-wrap h-auto">
              {statusTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket number or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastActivityAt">Last activity</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Raiser</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead>Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/support/${t.id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{t.ticketNumber}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{t.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={t.category} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={t.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{t.raiser?.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">{t.raiser?.email || ""}</div>
                    </div>
                  </TableCell>
                  <TableCell>{t.organization?.name || "—"}</TableCell>
                  <TableCell>
                    {t.lastActivityAt
                      ? formatDistanceToNow(t.lastActivityAt, { addSuffix: true })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {t.assignee?.name ? (
                      <div className="text-sm">{t.assignee.name}</div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
