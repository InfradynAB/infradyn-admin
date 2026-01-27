import { NextRequest, NextResponse } from "next/server";
import db from "@/db/drizzle";
import { invitation, member, supplier, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ 
                success: false, 
                error: "Missing token" 
            }, { status: 400 });
        }

        // Get session from cookies
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return NextResponse.json({ 
                success: false, 
                error: "You must be logged in to accept an invitation." 
            }, { status: 401 });
        }

        // 1. Find Invitation
        const invite = await db.query.invitation.findFirst({
            where: eq(invitation.token, token)
        });

        if (!invite) {
            return NextResponse.json({ 
                success: false, 
                error: "Invalid or expired invitation." 
            }, { status: 404 });
        }

        if (invite.status !== "PENDING") {
            return NextResponse.json({ 
                success: false, 
                error: "This invitation has already been used." 
            }, { status: 400 });
        }

        if (new Date() > invite.expiresAt) {
            return NextResponse.json({ 
                success: false, 
                error: "This invitation has expired." 
            }, { status: 400 });
        }

        // 2. Update User Role Globally
        await db.update(user)
            .set({ role: invite.role as any })
            .where(eq(user.id, session.user.id));

        // 3. Add to Members
        await db.insert(member).values({
            organizationId: invite.organizationId,
            userId: session.user.id,
            role: invite.role as any,
        });

        // 4. Update Invitation Status
        await db.update(invitation)
            .set({ status: "ACCEPTED" })
            .where(eq(invitation.id, invite.id));

        // 5. Handle Supplier Linking if applicable
        if (invite.role === "SUPPLIER" && invite.supplierId) {
            await db.update(supplier)
                .set({
                    userId: session.user.id,
                    status: 'ONBOARDING'
                })
                .where(eq(supplier.id, invite.supplierId));

            // Update user.supplierId for direct access
            await db.update(user)
                .set({ supplierId: invite.supplierId })
                .where(eq(user.id, session.user.id));
        }

        return NextResponse.json({ 
            success: true, 
            role: invite.role 
        });

    } catch (error) {
        console.error("Accept Invitation Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to join organization." 
        }, { status: 500 });
    }
}
