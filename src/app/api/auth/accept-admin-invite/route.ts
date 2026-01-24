import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { superAdminInvitation, user, auditLog, account } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/utils/password";

export async function POST(request: NextRequest) {
    try {
        const { token, name, password } = await request.json();

        if (!token || !name || !password) {
            return NextResponse.json({ 
                success: false, 
                error: "Missing required fields" 
            }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ 
                success: false, 
                error: "Password must be at least 8 characters" 
            }, { status: 400 });
        }

        // Find and validate the invitation
        const invite = await db.query.superAdminInvitation.findFirst({
            where: eq(superAdminInvitation.token, token),
        });

        if (!invite) {
            return NextResponse.json({ 
                success: false, 
                error: "Invitation not found" 
            }, { status: 404 });
        }

        if (invite.status !== "PENDING") {
            return NextResponse.json({ 
                success: false, 
                error: "This invitation is no longer valid" 
            }, { status: 400 });
        }

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ 
                success: false, 
                error: "This invitation has expired" 
            }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await db.query.user.findFirst({
            where: eq(user.email, invite.email),
        });

        if (existingUser) {
            return NextResponse.json({ 
                success: false, 
                error: "An account with this email already exists" 
            }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create the user with SUPER_ADMIN role
        const [newUser] = await db.insert(user).values({
            id: crypto.randomUUID(),
            email: invite.email,
            name: name.trim(),
            role: "SUPER_ADMIN",
            emailVerified: true, // Auto-verify since they received the invite email
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // Create account record for email/password auth (Better Auth pattern)
        await db.insert(account).values({
            id: crypto.randomUUID(),
            userId: newUser.id,
            accountId: newUser.id,
            providerId: "credential",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Update invitation status
        await db.update(superAdminInvitation)
            .set({ 
                status: "ACCEPTED", 
                acceptedUserId: newUser.id,
                updatedAt: new Date(),
            })
            .where(eq(superAdminInvitation.id, invite.id));

        // Log the event
        await db.insert(auditLog).values({
            action: "USER_CREATED",
            performedBy: invite.invitedBy,
            targetId: newUser.id,
            targetType: "USER",
            targetName: newUser.name,
            metadata: { 
                role: "SUPER_ADMIN",
                invitedVia: "admin_invitation",
            },
        });

        return NextResponse.json({ 
            success: true, 
            message: "Account created successfully" 
        });

    } catch (error) {
        console.error("Error accepting admin invite:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to create account" 
        }, { status: 500 });
    }
}
