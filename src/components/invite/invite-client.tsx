"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptInvitation } from "@/lib/actions/invitation";
import Link from "next/link";
import { CheckCircle, CircleNotch, Warning, Sparkle, ArrowRight, SignOut } from "@phosphor-icons/react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

import { InviteAuthForm } from "./invite-auth-form";

interface InviteClientProps {
    token: string;
    organizationName: string;
    role: string;
    inviteEmail: string;
    isLoggedIn: boolean;
    currentUserEmail?: string | null;
}

export function InviteClient({
    token,
    organizationName,
    role,
    inviteEmail,
    isLoggedIn: initialIsLoggedIn,
    currentUserEmail
}: InviteClientProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleAccept = () => {
        startTransition(async () => {
            try {
                const result = await acceptInvitation(token);
                if (result.success) {
                    toast.success("Welcome aboard! Redirecting to your workspace...");
                    if (result.role === "SUPPLIER") {
                        router.push("/dashboard/supplier/onboarding");
                    } else {
                        router.push("/dashboard");
                    }
                } else {
                    toast.error(result.error || "Failed to accept invitation.");
                }
            } catch (error) {
                toast.error("Something went wrong. Please try again.");
            }
        });
    };

    // Callback when auth succeeds in the inline form
    const onAuthSuccess = () => {
        setIsLoggedIn(true);
        // Automatically try to accept the invite
        handleAccept();
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    setIsLoggedIn(false);
                    setIsSigningOut(false);
                    toast.success("Signed out. Please sign in with the invited email.");
                },
                onError: () => {
                    setIsSigningOut(false);
                    toast.error("Failed to sign out");
                }
            }
        });
    };

    // Warning if logged in with wrong email
    const emailMismatch = isLoggedIn && currentUserEmail && currentUserEmail.toLowerCase() !== inviteEmail.toLowerCase();

    return (
        <Card className="w-full max-w-[460px] border-none shadow-2xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
                {!isLoggedIn ? (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex items-center justify-center">
                                <Sparkle className="h-7 w-7" weight="duotone" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Join the Team</CardTitle>
                        <CardDescription className="text-base">
                            Create an account or sign in to accept your invitation
                        </CardDescription>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-600 flex items-center justify-center">
                                <CheckCircle className="h-7 w-7" weight="duotone" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Ready to Join!</CardTitle>
                        <CardDescription className="text-base">
                            You&apos;re signed in and ready to join <strong>{organizationName}</strong>
                        </CardDescription>
                    </>
                )}
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
                {emailMismatch && (
                    <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm border border-amber-500/20">
                        <div className="flex items-start gap-3">
                            <Warning className="h-5 w-5 shrink-0 mt-0.5" weight="duotone" />
                            <div className="space-y-2">
                                <p className="font-medium">Email Mismatch</p>
                                <p className="text-amber-600 dark:text-amber-500">
                                    You&apos;re signed in as <strong>{currentUserEmail}</strong>, but this invitation was sent to <strong>{inviteEmail}</strong>.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className="mt-2 border-amber-500/30 hover:bg-amber-500/10"
                                >
                                    {isSigningOut ? (
                                        <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <SignOut className="mr-2 h-4 w-4" />
                                    )}
                                    Sign out & use correct email
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {!isLoggedIn ? (
                    <InviteAuthForm email={inviteEmail} onSuccess={onAuthSuccess} />
                ) : !emailMismatch && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-5 w-5 text-primary" weight="duotone" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                                <p className="font-semibold text-foreground truncate">{currentUserEmail}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Organization</p>
                                <p className="font-semibold text-foreground">{organizationName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Your Role</p>
                                <p className="font-semibold text-foreground uppercase text-sm">{role.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            {isLoggedIn && !emailMismatch && (
                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        className="w-full h-12 font-semibold text-base gap-2"
                        onClick={handleAccept}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <CircleNotch className="h-5 w-5 animate-spin" />
                                Setting up your workspace...
                            </>
                        ) : (
                            <>
                                Accept Invitation
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                    <Link href="/sign-in" className="w-full">
                        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" disabled={isPending}>
                            Decline & go to sign in
                        </Button>
                    </Link>
                </CardFooter>
            )}
        </Card>
    );
}

