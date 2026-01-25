"use server";

import db from "@/db/drizzle";
import { auditLog, user } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { headers } from "next/headers";

interface AuditLogEntry {
    id: string;
    action: string;
    targetType: string | null;
    targetId: string | null;
    targetName: string | null;
    metadata: unknown;
    createdAt: Date;
    performedBy: string | null;
    userName?: string | null;
}

interface GetAuditLogsInput {
    targetType?: string;
    targetId?: string;
    limit?: number;
}

/**
 * Get audit log entries, optionally filtered by entity
 */
export async function getAuditLogs(input: GetAuditLogsInput = {}): Promise<{
    success: boolean;
    data?: AuditLogEntry[];
    error?: string;
}> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const whereConditions = [];

        if (input.targetType) {
            whereConditions.push(eq(auditLog.targetType, input.targetType));
        }
        if (input.targetId) {
            whereConditions.push(eq(auditLog.targetId, input.targetId));
        }

        const logs = await db
            .select({
                id: auditLog.id,
                action: auditLog.action,
                targetType: auditLog.targetType,
                targetId: auditLog.targetId,
                targetName: auditLog.targetName,
                metadata: auditLog.metadata,
                createdAt: auditLog.createdAt,
                performedBy: auditLog.performedBy,
            })
            .from(auditLog)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(auditLog.createdAt))
            .limit(input.limit || 50);

        // Enrich with user names
        const enrichedLogs: AuditLogEntry[] = [];
        const userCache: Record<string, string> = {};

        for (const log of logs) {
            let userName: string | null = null;

            if (log.performedBy) {
                if (userCache[log.performedBy]) {
                    userName = userCache[log.performedBy];
                } else {
                    const u = await db.query.user.findFirst({
                        where: eq(user.id, log.performedBy),
                    });
                    if (u) {
                        userName = u.name;
                        userCache[log.performedBy] = u.name;
                    }
                }
            }

            enrichedLogs.push({
                ...log,
                userName,
            });
        }

        return { success: true, data: enrichedLogs };
    } catch (error) {
        console.error("[getAuditLogs] Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to get audit logs" };
    }
}

/**
 * Get audit logs for a specific purchase order (all related entities)
 */
export async function getPOAuditLogs(purchaseOrderId: string): Promise<{
    success: boolean;
    data?: AuditLogEntry[];
    error?: string;
}> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        // Get logs that mention this PO in targetId or metadata
        const logs = await db
            .select({
                id: auditLog.id,
                action: auditLog.action,
                targetType: auditLog.targetType,
                targetId: auditLog.targetId,
                targetName: auditLog.targetName,
                metadata: auditLog.metadata,
                createdAt: auditLog.createdAt,
                performedBy: auditLog.performedBy,
            })
            .from(auditLog)
            .where(
                sql`${auditLog.targetId} = ${purchaseOrderId} 
                    OR ${auditLog.metadata}::text LIKE ${'%' + purchaseOrderId + '%'}`
            )
            .orderBy(desc(auditLog.createdAt))
            .limit(100);

        // Enrich with user names
        const enrichedLogs: AuditLogEntry[] = [];
        const userCache: Record<string, string> = {};

        for (const log of logs) {
            let userName: string | null = null;

            if (log.performedBy) {
                if (userCache[log.performedBy]) {
                    userName = userCache[log.performedBy];
                } else {
                    const u = await db.query.user.findFirst({
                        where: eq(user.id, log.performedBy),
                    });
                    if (u) {
                        userName = u.name;
                        userCache[log.performedBy] = u.name;
                    }
                }
            }

            enrichedLogs.push({
                ...log,
                userName,
            });
        }

        return { success: true, data: enrichedLogs };
    } catch (error) {
        console.error("[getPOAuditLogs] Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to get PO audit logs" };
    }
}
