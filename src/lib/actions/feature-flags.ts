"use server";

import  db  from "@/db/drizzle";
import { featureFlag, auditLog, impersonationToken, user } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";

/**
 * Create a new feature flag
 */
export async function createFeatureFlag(data: {
  name: string;
  key: string;
  description?: string;
  isEnabled: boolean;
}) {
  const superAdmin = await requireSuperAdmin();

  try {
    const [flag] = await db.insert(featureFlag).values({
      name: data.name,
      key: data.key,
      description: data.description,
      isEnabled: data.isEnabled,
    }).returning();

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "FEATURE_FLAG_CHANGED",
      performedBy: superAdmin.id,
      targetType: "FEATURE_FLAG",
      targetId: flag.id,
      targetName: flag.name,
      metadata: { action: "created", isEnabled: data.isEnabled },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true, flag };
  } catch (error) {
    console.error("Error creating feature flag:", error);
    return { success: false, error: "Failed to create feature flag" };
  }
}

/**
 * Toggle a feature flag globally
 */
export async function toggleFeatureFlag(flagId: string, isEnabled: boolean) {
  const superAdmin = await requireSuperAdmin();

  try {
    await db.update(featureFlag)
      .set({ isEnabled })
      .where(eq(featureFlag.id, flagId));

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "FEATURE_FLAG_CHANGED",
      performedBy: superAdmin.id,
      targetType: "FEATURE_FLAG",
      targetId: flagId,
      metadata: { action: "toggled", isEnabled },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling feature flag:", error);
    return { success: false, error: "Failed to toggle feature flag" };
  }
}

/**
 * Enable feature for specific organizations
 */
export async function setFeatureFlagForOrgs(
  flagId: string,
  orgIds: string[],
  action: "enable" | "disable"
) {
  const superAdmin = await requireSuperAdmin();

  try {
    const flag = await db.query.featureFlag.findFirst({
      where: eq(featureFlag.id, flagId),
    });

    if (!flag) {
      return { success: false, error: "Feature flag not found" };
    }

    const updates: any = {};

    if (action === "enable") {
      const currentEnabled = flag.enabledForOrgs || [];
      updates.enabledForOrgs = [...new Set([...currentEnabled, ...orgIds])];
    } else {
      const currentDisabled = flag.disabledForOrgs || [];
      updates.disabledForOrgs = [...new Set([...currentDisabled, ...orgIds])];
    }

    await db.update(featureFlag)
      .set(updates)
      .where(eq(featureFlag.id, flagId));

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "FEATURE_FLAG_CHANGED",
      performedBy: superAdmin.id,
      targetType: "FEATURE_FLAG",
      targetId: flagId,
      metadata: { action, orgIds },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    return { success: true };
  } catch (error) {
    console.error("Error setting feature flag for orgs:", error);
    return { success: false, error: "Failed to update feature flag" };
  }
}

/**
 * List all feature flags
 */
export async function listFeatureFlags() {
  await requireSuperAdmin();

  try {
    const flags = await db.query.featureFlag.findMany({
      orderBy: (flags, { asc }) => [asc(flags.name)],
    });

    return { success: true, flags };
  } catch (error) {
    console.error("Error listing feature flags:", error);
    return { success: false, error: "Failed to list feature flags" };
  }
}

/**
 * Check if a feature is enabled (helper function for main app)
 * This should be called from the main application
 */
export async function isFeatureEnabled(
  flagKey: string,
  orgId?: string
): Promise<boolean> {
  try {
    const flag = await db.query.featureFlag.findFirst({
      where: eq(featureFlag.key, flagKey),
    });

    if (!flag) return false;

    // Check global status
    if (!flag.isEnabled) return false;

    // Check org-specific overrides
    if (orgId) {
      // If explicitly disabled for this org
      if (flag.disabledForOrgs?.includes(orgId)) return false;

      // If whitelist exists and org is not in it
      if (flag.enabledForOrgs && flag.enabledForOrgs.length > 0) {
        if (!flag.enabledForOrgs.includes(orgId)) return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking feature flag:", error);
    return false;
  }
}

/**
 * Generate impersonation token for user debugging
 * Returns a magic link that can be used in the main app
 */
export async function generateImpersonationToken(targetUserId: string) {
  const superAdmin = await requireSuperAdmin();

  try {
    // Get target user details
    const targetUser = await db.query.user.findFirst({
      where: eq(user.id, targetUserId),
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return { success: false, error: "Cannot impersonate super admins" };
    }

    // Generate token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(impersonationToken).values({
      token,
      superAdminId: superAdmin.id,
      targetUserId,
      expiresAt,
    });

    // Log the action
    const headersList = await headers();
    await db.insert(auditLog).values({
      action: "USER_IMPERSONATED",
      performedBy: superAdmin.id,
      targetType: "USER",
      targetId: targetUserId,
      targetName: targetUser.email,
      metadata: { targetUser: targetUser.email },
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "unknown",
    });

    // Generate the magic link (this would go to the main app)
    const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://app.infradyn.com";
    const magicLink = `${mainAppUrl}/api/auth/impersonate?token=${token}`;

    return { success: true, magicLink, expiresAt };
  } catch (error) {
    console.error("Error generating impersonation token:", error);
    return { success: false, error: "Failed to generate impersonation token" };
  }
}

/**
 * Validate and consume an impersonation token (to be used in main app)
 */
export async function validateImpersonationToken(token: string) {
  try {
    const tokenRecord = await db.query.impersonationToken.findFirst({
      where: eq(impersonationToken.token, token),
      with: {
        targetUser: true,
      },
    });

    if (!tokenRecord) {
      return { success: false, error: "Invalid token" };
    }

    // Check if already used
    if (tokenRecord.usedAt) {
      return { success: false, error: "Token already used" };
    }

    // Check if expired
    if (new Date() > tokenRecord.expiresAt) {
      return { success: false, error: "Token expired" };
    }

    // Mark as used
    await db.update(impersonationToken)
      .set({ usedAt: new Date() })
      .where(eq(impersonationToken.token, token));

    return {
      success: true,
      targetUser: tokenRecord.targetUser,
    };
  } catch (error) {
    console.error("Error validating impersonation token:", error);
    return { success: false, error: "Failed to validate token" };
  }
}
