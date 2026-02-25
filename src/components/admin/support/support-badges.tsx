import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/actions/support-actions";

export function CategoryBadge({ category }: { category: TicketCategory }) {
  const cls = {
    TECHNICAL: "bg-blue-500/10 text-blue-600",
    BILLING: "bg-cyan-500/10 text-cyan-600",
    ACCESS_ISSUE: "bg-amber-500/10 text-amber-600",
    BUG_REPORT: "bg-red-500/10 text-red-600",
    DATA_ISSUE: "bg-purple-500/10 text-purple-600",
    FEATURE_REQUEST: "bg-emerald-500/10 text-emerald-600",
    GENERAL: "bg-muted text-muted-foreground",
    OTHER: "bg-muted text-muted-foreground",
  }[category];

  return <Badge variant="secondary" className={cn("border-0", cls)}>{category.replace(/_/g, " ")}</Badge>;
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const cls = {
    OPEN: "bg-destructive/10 text-destructive",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600",
    AWAITING_USER: "bg-amber-500/10 text-amber-700",
    RESOLVED: "bg-emerald-500/10 text-emerald-700",
    CLOSED: "bg-muted text-muted-foreground",
  }[status];

  return <Badge variant="secondary" className={cn("border-0", cls)}>{status.replace(/_/g, " ")}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cls = {
    LOW: "bg-emerald-500/10 text-emerald-700",
    MEDIUM: "bg-amber-500/10 text-amber-700",
    HIGH: "bg-orange-500/10 text-orange-700",
    URGENT: "bg-destructive/10 text-destructive font-semibold",
  }[priority];

  return <Badge variant="secondary" className={cn("border-0", cls)}>{priority}</Badge>;
}
