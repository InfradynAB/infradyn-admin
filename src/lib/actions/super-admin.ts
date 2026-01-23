"use server";

import db from "@/db/drizzle";
import { organization, user, member, auditLog, superAdminInvitation } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/rbac";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

/**
 * Create a new organization and optionally invite a PM as the primary contact
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
  industry?: string;
  size?: string;
  contactEmail?: string;
  phone?: string;
  website?: string;
  plan: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  pmEmail?: string; // Optional: Invite a PM to this org
  pmName?: string;
}) {
  const superAdmin = await requireSuperAdmin();
  
  try {
    // Create organization
    const [newOrg] = await db.insert(organization).values({
      name: data.name,
      slug: data.slug,
      industry: data.industry,
      size: data.size,
      contactEmail: data.contactEmail,
      phone: data.phone,
      website: data.website,
      plan: data.plan,
      status: "TRIAL",
      createdBy: superAdmin.id,
      lastActivityAt: new Date(),
    }).returning();

    // If PM email provided, create or link PM user
    if (data.pmEmail) {
      // Check if user already exists
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, data.pmEmail),
      });

      let pmUser;
      
      if (existingUser) {
        // Link existing user to new org as PM
        pmUser = existingUser;
        
        // Update their organization if they don't have one
        if (!existingUser.organizationId) {
          await db.update(user)
            .set({ 
              organizationId: newOrg.id,
              role: "PM" 
            })
            .where(eq(user.id, existingUser.id));
        }
        
        // Add them as a member
        await db.insert(member).values({
          userId: existingUser.id,
          organizationId: newOrg.id,
          role: "PM",
        });
      } else {
        // Create new PM user
        [pmUser] = await db.insert(user).values({
          id: nanoid(),
          email: data.pmEmail,
          name: data.pmName || data.pmEmail.split("@")[0],
          role: "PM",
          organizationId: newOrg.id,
          emailVerified: false,
        }).returning();

        // Add them as a member
        await db.insert(member).values({
          userId: pmUser.id,
          organizationId: newOrg.id,
          role: "PM",
        });

        // TODO: Send welcome email with password setup link
        // await sendWelcomeEmail(pmUser.email, newOrg.name);
      }
    }

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "ORG_CREATED",
      performedBy: superAdmin.id,
      targetType: "ORGANIZATION",
      targetId: newOrg.id,
      targetName: newOrg.name,
      metadata: { plan: data.plan, pmEmail: data.pmEmail },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true, organization: newOrg };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: "Failed to create organization" };
  }
}

/**
 * Suspend an organization (blocks all users from logging in)
 */
export async function suspendOrganization(
  organizationId: string,
  reason: string
) {
  const superAdmin = await requireSuperAdmin();

  try {
    await db.update(organization)
      .set({
        status: "SUSPENDED",
        suspendedAt: new Date(),
        suspendedBy: superAdmin.id,
        suspensionReason: reason,
      })
      .where(eq(organization.id, organizationId));

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "ORG_SUSPENDED",
      performedBy: superAdmin.id,
      targetType: "ORGANIZATION",
      targetId: organizationId,
      metadata: { reason },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true };
  } catch (error) {
    console.error("Error suspending organization:", error);
    return { success: false, error: "Failed to suspend organization" };
  }
}

/**
 * Activate a suspended organization
 */
export async function activateOrganization(organizationId: string) {
  const superAdmin = await requireSuperAdmin();

  try {
    await db.update(organization)
      .set({
        status: "ACTIVE",
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
      })
      .where(eq(organization.id, organizationId));

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "ORG_ACTIVATED",
      performedBy: superAdmin.id,
      targetType: "ORGANIZATION",
      targetId: organizationId,
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true };
  } catch (error) {
    console.error("Error activating organization:", error);
    return { success: false, error: "Failed to activate organization" };
  }
}

/**
 * Update organization plan
 */
export async function updateOrganizationPlan(
  organizationId: string,
  plan: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE",
  monthlyRevenue?: string
) {
  const superAdmin = await requireSuperAdmin();

  try {
    await db.update(organization)
      .set({
        plan,
        monthlyRevenue: monthlyRevenue || "0",
      })
      .where(eq(organization.id, organizationId));

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "ORG_PLAN_CHANGED",
      performedBy: superAdmin.id,
      targetType: "ORGANIZATION",
      targetId: organizationId,
      metadata: { plan, monthlyRevenue },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating organization plan:", error);
    return { success: false, error: "Failed to update plan" };
  }
}

/**
 * Get platform-wide statistics for the God View Dashboard
 */
export async function getPlatformStats() {
  await requireSuperAdmin();

  try {
    // Total revenue
    const revenueResult = await db
      .select({ total: sql<number>`SUM(CAST(${organization.monthlyRevenue} AS NUMERIC))` })
      .from(organization)
      .where(eq(organization.status, "ACTIVE"));

    // Active organizations (activity in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeOrgsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(organization)
      .where(
        and(
          eq(organization.status, "ACTIVE"),
          gte(organization.lastActivityAt, sevenDaysAgo)
        )
      );

    // Total organizations
    const totalOrgsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(organization);

    // Total users
    const totalUsersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user);

    return {
      success: true,
      stats: {
        totalRevenue: revenueResult[0]?.total || 0,
        activeOrganizations: activeOrgsResult[0]?.count || 0,
        totalOrganizations: totalOrgsResult[0]?.count || 0,
        totalUsers: totalUsersResult[0]?.count || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}

/**
 * Get recent activity feed across all organizations
 */
export async function getRecentActivity(limit: number = 50) {
  await requireSuperAdmin();

  try {
    const activities = await db.query.auditLog.findMany({
      orderBy: [desc(auditLog.createdAt)],
      limit,
      with: {
        performer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return { success: true, activities };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return { success: false, error: "Failed to fetch activity" };
  }
}

/**
 * List all organizations with filters
 */
export async function listOrganizations(filters?: {
  status?: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "DELINQUENT";
  plan?: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  search?: string;
}) {
  await requireSuperAdmin();

  try {
    // Apply filters
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(organization.status, filters.status));
    }
    if (filters?.plan) {
      conditions.push(eq(organization.plan, filters.plan));
    }

    const orgs = conditions.length > 0
      ? await db.select().from(organization).where(and(...conditions))
      : await db.select().from(organization);

    return { success: true, organizations: orgs };
  } catch (error) {
    console.error("Error listing organizations:", error);
    return { success: false, error: "Failed to list organizations" };
  }
}

/**
 * Invite another super admin
 */
export async function inviteSuperAdmin(email: string) {
  const superAdmin = await requireSuperAdmin();

  try {
    // Check if user already exists with this email
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (existingUser?.role === "SUPER_ADMIN") {
      return { success: false, error: "User is already a super admin" };
    }

    // Generate invitation token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    await db.insert(superAdminInvitation).values({
      email,
      token,
      invitedBy: superAdmin.id,
      expiresAt,
      status: "PENDING",
    });

    // TODO: Send invitation email
    // await sendSuperAdminInvitationEmail(email, token);

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "SUPER_ADMIN_INVITED",
      performedBy: superAdmin.id,
      targetType: "USER",
      targetName: email,
      metadata: { email },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true, message: "Invitation sent successfully" };
  } catch (error) {
    console.error("Error inviting super admin:", error);
    return { success: false, error: "Failed to send invitation" };
  }
}
