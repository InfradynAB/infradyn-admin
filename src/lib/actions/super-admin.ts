"use server";

import db from "@/db/drizzle";
import { organization, user, member, auditLog, superAdminInvitation, invitation } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/rbac";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { Resend } from "resend";
import { render } from "@react-email/render";
import SuperAdminInviteEmail from "@/emails/super-admin-invite-email";
import InvitationEmail from "@/emails/invitation-email";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    // Check if slug already exists
    const existingOrg = await db.query.organization.findFirst({
      where: eq(organization.slug, data.slug),
    });

    if (existingOrg) {
      return { success: false, error: `An organization with slug "${data.slug}" already exists. Please choose a different name.` };
    }

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

    // If PM email provided, send invitation
    if (data.pmEmail) {
      // Check if user already exists
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, data.pmEmail),
      });

      if (existingUser) {
        // Link existing user to new org as PM
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

        // Still send email notification that they've been added
        try {
          const emailHtml = await render(
            InvitationEmail({
              organizationName: newOrg.name,
              role: "Project Manager",
              inviteLink: `${process.env.MAIN_APP_URL || "https://materials.infradyn.com"}/sign-in`,
              inviterName: data.pmName || existingUser.name || "there"
            })
          );

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: data.pmEmail,
            subject: `You've been added to ${newOrg.name} on Infradyn`,
            html: emailHtml
          });
        } catch (emailError) {
          console.error("[CREATE_ORG] Failed to send notification email:", emailError);
        }
      } else {
        // Create invitation for new PM
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await db.insert(invitation).values({
          organizationId: newOrg.id,
          email: data.pmEmail,
          role: "PM",
          token,
          expiresAt,
          status: "PENDING",
        });

        // Send invitation email - link to MAIN APP (materials.infradyn.com) not admin
        const inviteUrl = `${process.env.MAIN_APP_URL || "https://materials.infradyn.com"}/invite/${token}`;
        
        try {
          const emailHtml = await render(
            InvitationEmail({
              organizationName: newOrg.name,
              role: "Project Manager",
              inviteLink: inviteUrl,
              inviterName: data.pmName || "there"
            })
          );

          const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: data.pmEmail,
            subject: `Join ${newOrg.name} on Infradyn`,
            html: emailHtml
          });

          if (result.error) {
            console.error("[CREATE_ORG] Resend error:", result.error);
          } else {
            console.log("[CREATE_ORG] Invitation email sent to:", data.pmEmail);
          }
        } catch (emailError) {
          console.error("[CREATE_ORG] Failed to send invitation email:", emailError);
        }
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
      .from(organization);

    // Active organizations (status = ACTIVE or TRIAL, not suspended/cancelled)
    const activeOrgsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(organization)
      .where(
        sql`${organization.status} IN ('ACTIVE', 'TRIAL')`
      );

    // Total organizations
    const totalOrgsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(organization);

    // Total users
    const totalUsersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user);

    // Get organizations by plan for pie chart
    const planDistribution = await db
      .select({ 
        plan: organization.plan, 
        count: sql<number>`COUNT(*)` 
      })
      .from(organization)
      .groupBy(organization.plan);

    // Get monthly growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Get organizations created per month
    const orgGrowth = await db
      .select({
        month: sql<string>`TO_CHAR(${organization.createdAt}, 'Mon')`,
        monthNum: sql<number>`EXTRACT(MONTH FROM ${organization.createdAt})`,
        year: sql<number>`EXTRACT(YEAR FROM ${organization.createdAt})`,
        count: sql<number>`COUNT(*)`
      })
      .from(organization)
      .where(gte(organization.createdAt, sixMonthsAgo))
      .groupBy(
        sql`TO_CHAR(${organization.createdAt}, 'Mon')`,
        sql`EXTRACT(MONTH FROM ${organization.createdAt})`,
        sql`EXTRACT(YEAR FROM ${organization.createdAt})`
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${organization.createdAt})`,
        sql`EXTRACT(MONTH FROM ${organization.createdAt})`
      );

    // Get users created per month
    const userGrowth = await db
      .select({
        month: sql<string>`TO_CHAR(${user.createdAt}, 'Mon')`,
        monthNum: sql<number>`EXTRACT(MONTH FROM ${user.createdAt})`,
        year: sql<number>`EXTRACT(YEAR FROM ${user.createdAt})`,
        count: sql<number>`COUNT(*)`
      })
      .from(user)
      .where(gte(user.createdAt, sixMonthsAgo))
      .groupBy(
        sql`TO_CHAR(${user.createdAt}, 'Mon')`,
        sql`EXTRACT(MONTH FROM ${user.createdAt})`,
        sql`EXTRACT(YEAR FROM ${user.createdAt})`
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${user.createdAt})`,
        sql`EXTRACT(MONTH FROM ${user.createdAt})`
      );

    // Get revenue by month (sum of monthlyRevenue for orgs created that month)
    const revenueGrowth = await db
      .select({
        month: sql<string>`TO_CHAR(${organization.createdAt}, 'Mon')`,
        monthNum: sql<number>`EXTRACT(MONTH FROM ${organization.createdAt})`,
        year: sql<number>`EXTRACT(YEAR FROM ${organization.createdAt})`,
        revenue: sql<number>`SUM(CAST(${organization.monthlyRevenue} AS NUMERIC))`
      })
      .from(organization)
      .where(gte(organization.createdAt, sixMonthsAgo))
      .groupBy(
        sql`TO_CHAR(${organization.createdAt}, 'Mon')`,
        sql`EXTRACT(MONTH FROM ${organization.createdAt})`,
        sql`EXTRACT(YEAR FROM ${organization.createdAt})`
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${organization.createdAt})`,
        sql`EXTRACT(MONTH FROM ${organization.createdAt})`
      );

    return {
      success: true,
      stats: {
        totalRevenue: revenueResult[0]?.total || 0,
        activeOrganizations: activeOrgsResult[0]?.count || 0,
        totalOrganizations: totalOrgsResult[0]?.count || 0,
        totalUsers: totalUsersResult[0]?.count || 0,
      },
      chartData: {
        planDistribution: planDistribution.map(p => ({
          name: p.plan,
          value: Number(p.count)
        })),
        orgGrowth: orgGrowth.map(o => ({
          month: o.month,
          count: Number(o.count)
        })),
        userGrowth: userGrowth.map(u => ({
          month: u.month,
          count: Number(u.count)
        })),
        revenueGrowth: revenueGrowth.map(r => ({
          month: r.month,
          revenue: Number(r.revenue) || 0
        }))
      }
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
 * Get single organization with full details
 */
export async function getOrganization(organizationId: string) {
  await requireSuperAdmin();

  try {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });

    if (!org) {
      return { success: false, error: "Organization not found" };
    }

    // Get user count
    const userCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(user)
      .where(eq(user.organizationId, organizationId));

    // Get member list
    const members = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        isSuspended: user.isSuspended,
      })
      .from(user)
      .where(eq(user.organizationId, organizationId));

    return { 
      success: true, 
      organization: org,
      userCount: userCount[0]?.count || 0,
      members,
    };
  } catch (error) {
    console.error("Error fetching organization:", error);
    return { success: false, error: "Failed to fetch organization" };
  }
}

/**
 * Update organization details
 */
export async function updateOrganization(organizationId: string, data: {
  name?: string;
  industry?: string;
  size?: string;
  contactEmail?: string;
  phone?: string;
  website?: string;
}) {
  const superAdmin = await requireSuperAdmin();

  try {
    await db.update(organization)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organization.id, organizationId));

    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "ORG_UPDATED",
      performedBy: superAdmin.id,
      targetType: "ORGANIZATION",
      targetId: organizationId,
      metadata: data,
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: "Failed to update organization" };
  }
}

/**
 * Search users across all organizations
 */
export async function searchUsers(query: string) {
  await requireSuperAdmin();

  try {
    // If no query, return all users
    if (!query || query.length < 2) {
      // First get users with their direct organizationId
      const usersWithDirectOrg = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuspended: user.isSuspended,
          lastLoginAt: user.lastLoginAt,
          organizationId: user.organizationId,
          organizationName: organization.name,
          createdAt: user.createdAt,
        })
        .from(user)
        .leftJoin(organization, eq(user.organizationId, organization.id))
        .orderBy(desc(user.createdAt))
        .limit(100);

      // For users without organizationId, check member table
      const enrichedUsers = await Promise.all(
        usersWithDirectOrg.map(async (u) => {
          if (!u.organizationId && !u.organizationName) {
            // Check member table for organization
            const membership = await db
              .select({
                organizationId: member.organizationId,
                organizationName: organization.name,
              })
              .from(member)
              .innerJoin(organization, eq(member.organizationId, organization.id))
              .where(eq(member.userId, u.id))
              .limit(1);

            if (membership.length > 0) {
              return {
                ...u,
                organizationId: membership[0].organizationId,
                organizationName: membership[0].organizationName,
              };
            }
          }
          return u;
        })
      );

      return { success: true, users: enrichedUsers };
    }

    const searchQuery = `%${query.toLowerCase()}%`;
    
    const usersWithDirectOrg = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuspended: user.isSuspended,
        lastLoginAt: user.lastLoginAt,
        organizationId: user.organizationId,
        organizationName: organization.name,
        createdAt: user.createdAt,
      })
      .from(user)
      .leftJoin(organization, eq(user.organizationId, organization.id))
      .where(
        sql`LOWER(${user.email}) LIKE ${searchQuery} OR LOWER(${user.name}) LIKE ${searchQuery}`
      )
      .limit(50);

    // Enrich with member table data
    const enrichedUsers = await Promise.all(
      usersWithDirectOrg.map(async (u) => {
        if (!u.organizationId && !u.organizationName) {
          const membership = await db
            .select({
              organizationId: member.organizationId,
              organizationName: organization.name,
            })
            .from(member)
            .innerJoin(organization, eq(member.organizationId, organization.id))
            .where(eq(member.userId, u.id))
            .limit(1);

          if (membership.length > 0) {
            return {
              ...u,
              organizationId: membership[0].organizationId,
              organizationName: membership[0].organizationName,
            };
          }
        }
        return u;
      })
    );

    return { success: true, users: enrichedUsers };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: "Failed to search users" };
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

    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/admin/${token}`;
    const emailHtml = await render(SuperAdminInviteEmail({
      inviteLink,
      inviterName: superAdmin.name || "Admin",
    }));

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "You're invited as a Super Admin on Infradyn",
      html: emailHtml,
    });

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
