"use server";

import db from "@/db/drizzle";
import {
  supportTicket,
  supportTicketMessage,
  user,
} from "@/db/schema";
import { requireSuperAdmin } from "@/lib/rbac";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { Resend } from "resend";
import { render } from "@react-email/render";
import TicketResponseEmail from "@/emails/ticket-response-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export type TicketCategory =
  | "TECHNICAL"
  | "BILLING"
  | "ACCESS_ISSUE"
  | "BUG_REPORT"
  | "DATA_ISSUE"
  | "FEATURE_REQUEST"
  | "GENERAL"
  | "OTHER";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "AWAITING_USER" | "RESOLVED" | "CLOSED";

export type TicketMessage = {
  id: string;
  ticketId: string;
  content: string;
  isFromSupport: boolean;
  isInternal: boolean;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  createdAt: Date | null;
  sender: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

export type TicketWithThread = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  organizationId: string | null;
  assignedTo: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  raiser: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image: string | null;
  } | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  organization: {
    id: string;
    name: string;
  } | null;
  messages: TicketMessage[];
};

export type TicketListItem = {
  id: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  organizationId: string | null;
  assignedTo: string | null;
  lastActivityAt: Date | null;
  createdAt: Date | null;
  raiser: { id: string; name: string | null; email: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  organization: { id: string; name: string } | null;
};

const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "AWAITING_USER", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["AWAITING_USER", "RESOLVED", "CLOSED"],
  AWAITING_USER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "OPEN"],
  CLOSED: [],
};

function canTransition(from: TicketStatus, to: TicketStatus) {
  return from === to || STATUS_TRANSITIONS[from].includes(to);
}

export async function getSupportStats() {
  await requireSuperAdmin();

  const byStatus = await db
    .select({
      status: supportTicket.status,
      count: sql<number>`count(*)::int`,
    })
    .from(supportTicket)
    .where(eq(supportTicket.isDeleted, false))
    .groupBy(supportTicket.status);

  const byPriority = await db
    .select({
      priority: supportTicket.priority,
      count: sql<number>`count(*)::int`,
    })
    .from(supportTicket)
    .where(eq(supportTicket.isDeleted, false))
    .groupBy(supportTicket.priority);

  const statusCounts = {
    open: 0,
    in_progress: 0,
    awaiting_user: 0,
    resolved: 0,
    closed: 0,
  };

  for (const row of byStatus) {
    switch (row.status as TicketStatus) {
      case "OPEN":
        statusCounts.open = row.count;
        break;
      case "IN_PROGRESS":
        statusCounts.in_progress = row.count;
        break;
      case "AWAITING_USER":
        statusCounts.awaiting_user = row.count;
        break;
      case "RESOLVED":
        statusCounts.resolved = row.count;
        break;
      case "CLOSED":
        statusCounts.closed = row.count;
        break;
    }
  }

  let urgent = 0;
  let high = 0;
  for (const row of byPriority) {
    if ((row.priority as TicketPriority) === "URGENT") urgent = row.count;
    if ((row.priority as TicketPriority) === "HIGH") high = row.count;
  }

  return { ...statusCounts, urgent, high };
}

export async function getAllTickets(statusFilter?: TicketStatus): Promise<TicketListItem[]> {
  await requireSuperAdmin();

  const where = statusFilter
    ? and(eq(supportTicket.isDeleted, false), eq(supportTicket.status, statusFilter))
    : eq(supportTicket.isDeleted, false);

  const rows = await db.query.supportTicket.findMany({
    where,
    with: {
      raiser: {
        columns: { id: true, name: true, email: true },
      },
      assignee: {
        columns: { id: true, name: true, email: true },
      },
      organization: {
        columns: { id: true, name: true },
      },
    },
    orderBy: [desc(supportTicket.lastActivityAt), desc(supportTicket.createdAt)],
  });

  return rows.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    category: t.category as TicketCategory,
    priority: t.priority as TicketPriority,
    status: t.status as TicketStatus,
    organizationId: t.organizationId,
    assignedTo: t.assignedTo,
    lastActivityAt: t.lastActivityAt,
    createdAt: t.createdAt,
    raiser: t.raiser,
    assignee: t.assignee,
    organization: t.organization,
  }));
}

export async function getTicketWithThread(ticketId: string): Promise<TicketWithThread | null> {
  await requireSuperAdmin();

  const t = await db.query.supportTicket.findFirst({
    where: and(eq(supportTicket.isDeleted, false), eq(supportTicket.id, ticketId)),
    with: {
      raiser: {
        columns: { id: true, name: true, email: true, role: true, image: true },
      },
      assignee: {
        columns: { id: true, name: true, email: true },
      },
      organization: {
        columns: { id: true, name: true },
      },
      messages: {
        with: {
          sender: { columns: { id: true, name: true, email: true, image: true } },
        },
        orderBy: [asc(supportTicketMessage.createdAt)],
      },
    },
  });

  if (!t) return null;

  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category as TicketCategory,
    priority: t.priority as TicketPriority,
    status: t.status as TicketStatus,
    organizationId: t.organizationId,
    assignedTo: t.assignedTo,
    resolvedAt: t.resolvedAt,
    closedAt: t.closedAt,
    lastActivityAt: t.lastActivityAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    raiser: t.raiser,
    assignee: t.assignee,
    organization: t.organization,
    messages: (t.messages || []).map((m) => ({
      id: m.id,
      ticketId: m.ticketId,
      content: m.content,
      isFromSupport: m.isFromSupport,
      isInternal: m.isInternal,
      attachmentUrl: m.attachmentUrl,
      attachmentName: m.attachmentName,
      attachmentType: m.attachmentType,
      createdAt: m.createdAt,
      sender: m.sender,
    })),
  };
}

export async function listSupportAssignees() {
  await requireSuperAdmin();

  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(and(eq(user.isDeleted, false), inArray(user.role, ["SUPER_ADMIN", "ADMIN"])))
    .orderBy(asc(user.name));

  return rows;
}

export async function addTicketReply(formData: FormData) {
  const admin = await requireSuperAdmin();

  const ticketId = String(formData.get("ticketId") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const isInternal = String(formData.get("isInternal") || "false") === "true";
  const attachmentUrl = (formData.get("attachmentUrl") ? String(formData.get("attachmentUrl")) : null) as string | null;
  const attachmentName = (formData.get("attachmentName") ? String(formData.get("attachmentName")) : null) as string | null;
  const attachmentType = (formData.get("attachmentType") ? String(formData.get("attachmentType")) : null) as string | null;

  if (!ticketId) return { success: false, error: "ticketId is required" };
  if (!content) return { success: false, error: "content is required" };

  const existing = await db.query.supportTicket.findFirst({
    where: and(eq(supportTicket.isDeleted, false), eq(supportTicket.id, ticketId)),
    columns: { id: true, status: true },
  });

  if (!existing) return { success: false, error: "Ticket not found" };
  if ((existing.status as TicketStatus) === "CLOSED") {
    return { success: false, error: "Ticket is closed" };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(supportTicketMessage).values({
        ticketId,
        senderId: admin.id,
        content,
        isFromSupport: true,
        isInternal,
        attachmentUrl,
        attachmentName,
        attachmentType,
      });

      // Keep status stable for internal notes; otherwise move into active handling.
      const nextStatus = isInternal ? (existing.status as TicketStatus) : "IN_PROGRESS";

      await tx
        .update(supportTicket)
        .set({
          status: nextStatus,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(supportTicket.id, ticketId));
    });

    if (!isInternal) {
      try {
        const ticketWithRaiser = await db.query.supportTicket.findFirst({
          where: and(eq(supportTicket.isDeleted, false), eq(supportTicket.id, ticketId)),
          columns: {
            ticketNumber: true,
            subject: true,
          },
          with: {
            raiser: {
              columns: {
                email: true,
                name: true,
              },
            },
          },
        });

        if (ticketWithRaiser?.raiser?.email) {
          const ticketUrlBase =
            process.env.MATERIALS_APP_URL ||
            process.env.NEXT_PUBLIC_MATERIALS_APP_URL ||
            process.env.MAIN_APP_URL ||
            "https://materials.infradyn.com";

          const emailHtml = await render(
            TicketResponseEmail({
              userName: ticketWithRaiser.raiser.name || "there",
              ticketNumber: ticketWithRaiser.ticketNumber,
              subject: ticketWithRaiser.subject,
              responsePreview: content,
              ticketUrl: `${ticketUrlBase.replace(/\/$/, "")}/dashboard/support/${ticketId}`,
            })
          );

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: ticketWithRaiser.raiser.email,
            subject: `Response to your support ticket ${ticketWithRaiser.ticketNumber}`,
            html: emailHtml,
          });
        }
      } catch (emailError) {
        console.error("[SUPPORT] Failed to send response email:", emailError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[SUPPORT] addTicketReply error:", error);
    return { success: false, error: "Failed to post reply" };
  }
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  await requireSuperAdmin();

  const existing = await db.query.supportTicket.findFirst({
    where: and(eq(supportTicket.isDeleted, false), eq(supportTicket.id, ticketId)),
    columns: { id: true, status: true },
  });

  if (!existing) return { success: false, error: "Ticket not found" };

  const from = existing.status as TicketStatus;
  if (!canTransition(from, status)) {
    return { success: false, error: `Invalid transition: ${from} → ${status}` };
  }
  if (from === "CLOSED" && status !== "CLOSED") {
    return { success: false, error: "Closed tickets are terminal" };
  }

  const patch: {
    status: TicketStatus;
    updatedAt: Date;
    resolvedAt?: Date | null;
    closedAt?: Date | null;
  } = {
    status,
    updatedAt: new Date(),
  };

  if (status === "RESOLVED") patch.resolvedAt = new Date();
  if (status !== "RESOLVED") patch.resolvedAt = null;
  if (status === "CLOSED") patch.closedAt = new Date();
  if (status !== "CLOSED") patch.closedAt = null;

  try {
    await db.update(supportTicket).set(patch).where(eq(supportTicket.id, ticketId));
    return { success: true };
  } catch (error) {
    console.error("[SUPPORT] updateTicketStatus error:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function assignTicket(ticketId: string, assignToUserId: string) {
  await requireSuperAdmin();

  try {
    await db
      .update(supportTicket)
      .set({ assignedTo: assignToUserId || null, updatedAt: new Date() })
      .where(and(eq(supportTicket.isDeleted, false), eq(supportTicket.id, ticketId)));
    return { success: true };
  } catch (error) {
    console.error("[SUPPORT] assignTicket error:", error);
    return { success: false, error: "Failed to assign ticket" };
  }
}
