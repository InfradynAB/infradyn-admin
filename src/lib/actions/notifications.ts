"use server";

import db from "@/db/drizzle";
import { notification } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// NOTIFICATION ACTIONS (Admin Dashboard)
// ============================================================================

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string) {
    try {
        const notifications = await db.query.notification.findMany({
            where: and(
                eq(notification.userId, userId),
            ),
            orderBy: (n, { desc }) => [desc(n.createdAt)],
            limit: 20,
        });

        return { success: true, data: notifications };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[GET_NOTIFICATIONS]", error);
        return { success: false, error: message, data: [] };
    }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]) {
    try {
        await Promise.all(
            notificationIds.map(id =>
                db.update(notification)
                    .set({ readAt: new Date() })
                    .where(eq(notification.id, id))
            )
        );

        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[MARK_READ]", error);
        return { success: false, error: message };
    }
}
