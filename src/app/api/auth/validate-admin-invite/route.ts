import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { superAdminInvitation, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
        return NextResponse.json({ valid: false, error: "Token is required" });
    }

    try {
        const invite = await db.query.superAdminInvitation.findFirst({
            where: eq(superAdminInvitation.token, token),
            with: {
                inviter: true,
            },
        });

        if (!invite) {
            return NextResponse.json({ valid: false, error: "Invitation not found" });
        }

        if (invite.status !== "PENDING") {
            return NextResponse.json({ 
                valid: false, 
                error: invite.status === "ACCEPTED" 
                    ? "This invitation has already been used" 
                    : "This invitation has been revoked" 
            });
        }

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ valid: false, error: "This invitation has expired" });
        }

        // Check if user with this email already exists
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, invite.email),
        });

        if (existingUser) {
            return NextResponse.json({ 
                valid: false, 
                error: "An account with this email already exists. Please sign in instead." 
            });
        }

        return NextResponse.json({
            valid: true,
            email: invite.email,
            inviterName: invite.inviter?.name || "Admin",
            expiresAt: invite.expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("Error validating admin invite:", error);
        return NextResponse.json({ valid: false, error: "Failed to validate invitation" });
    }
}
