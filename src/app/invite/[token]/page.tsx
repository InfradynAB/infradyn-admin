import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import db from "@/db/drizzle";
import { invitation } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { XCircle } from "@phosphor-icons/react/dist/ssr";
import { InviteClient } from "@/components/invite/invite-client";
import { auth } from "@/auth";
import { headers } from "next/headers";

import { InviteHero } from "@/components/invite/invite-hero";

// This is a public page, but validation happens in server action
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {

    const { token } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });


    // Fetch basic invite info to show context *before* accepting
    const invite = await db.query.invitation.findFirst({
        where: eq(invitation.token, token),
        with: {
            organization: true
        }
    });

    // Explicit check for undefined organization to satisfy Typescript if inference fails
    const isInvalid = !invite || invite.status !== "PENDING" || new Date() > invite.expiresAt || !invite.organization;

    if (isInvalid) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
                <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="text-center pt-10">
                        <div className="flex justify-center mb-6">
                            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                <XCircle className="h-12 w-12" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-black">Invitation Expired</CardTitle>
                        <CardDescription className="text-base pt-2">
                            This invitation link is invalid, has expired, or has already been used. Please contact your administrator for a new invitation.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pb-10">
                        <Link href="/sign-in">
                            <Button variant="secondary" className="h-12 px-8 rounded-xl font-bold">Go to Sign In</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Pass serializable data to client component
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-[460px] flex flex-col items-center">
                <InviteHero
                    organizationName={invite.organization.name}
                    role={invite.role}
                />
                <InviteClient
                    token={token}
                    organizationName={invite.organization.name}
                    role={invite.role}
                    inviteEmail={invite.email}
                    isLoggedIn={!!session?.user}
                    currentUserEmail={session?.user?.email}
                />
            </div>
        </main>
    );
}

