import { auth } from "../../auth"; // or relative path if needed, but @/auth works usually if baseUrl=./
import { headers } from "next/headers";

// Define Roles and Permissions
export type Role = "SUPER_ADMIN" | "PM" | "SUPPLIER" | "QA" | "SITE_RECEIVER";

export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    PM: "PM",
    SUPPLIER: "SUPPLIER",
    QA: "QA",
    SITE_RECEIVER: "SITE_RECEIVER",
} as const;

/**
 * Checks if a user has a specific global role.
 */
export function hasRole(user: { role: string }, role: Role): boolean {
    return user.role === role;
}

/**
 * Checks if a user is a Super Admin (Infradyn staff).
 */
export function isSuperAdmin(user: { role: string }): boolean {
    return user.role === "SUPER_ADMIN";
}

// Extended user type to include custom fields from our schema
type AppUser = {
    id: string;
    email: string;
    name: string;
    role?: Role;
    isSuspended?: boolean;
};

/**
 * Server-side helper to get current session and check role.
 */
export async function requireRole(role: Role): Promise<boolean> {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return false;
    }

    // Cast to our extended type that includes role
    const user = session.user as AppUser;
    return user.role === role;
}

/**
 * Require Super Admin access - throws if not authorized.
 * Use this in admin-only routes and API endpoints.
 */
export async function requireSuperAdmin(): Promise<AppUser> {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        throw new Error("Unauthorized: No session found");
    }

    const user = session.user as AppUser;
    
    if (user.role !== "SUPER_ADMIN") {
        throw new Error("Forbidden: Super Admin access required");
    }

    if (user.isSuspended) {
        throw new Error("Forbidden: Account is suspended");
    }

    return user;
}

/**
 * Check if organization is suspended and block access.
 */
export async function checkOrganizationAccess(organizationId: string): Promise<boolean> {
    // This will be implemented to check organization status
    // from the database in the main app middleware
    return true;
}

// TODO: Organization-level permission checks (using member table)
// This will likely require db queries, so keep it separate or pass membership data.
