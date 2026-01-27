"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XCircle, Shield, Loader2, Eye, EyeOff, ArrowRight, CheckCircle, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";

interface InviteData {
    valid: boolean;
    email?: string;
    inviterName?: string;
    expiresAt?: string;
    error?: string;
}

export default function SuperAdminInvitePage({ params }: { params: Promise<{ token: string }> }) {
    const router = useRouter();
    const [token, setToken] = useState<string>("");
    const [inviteData, setInviteData] = useState<InviteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mode, setMode] = useState<"signup" | "signin">("signup");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        async function init() {
            const { token: t } = await params;
            setToken(t);
            
            // Validate the invite
            const res = await fetch(`/api/auth/validate-admin-invite?token=${t}`);
            const data = await res.json();
            setInviteData(data);
            setLoading(false);
        }
        init();
    }, [params]);

    const handleAccept = async () => {
        if (!name.trim()) {
            toast.error("Please enter your name");
            return;
        }
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setAccepting(true);
        try {
            const res = await fetch("/api/auth/accept-admin-invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, name, password }),
            });

            const result = await res.json();

            if (result.success) {
                toast.success("Account created! Signing you in...");
                // Auto sign-in after account creation
                await authClient.signIn.email(
                    {
                        email: inviteData?.email || "",
                        password: password,
                    },
                    {
                        onSuccess: () => {
                            toast.success("Welcome to the admin dashboard!");
                            router.push("/");
                        },
                        onError: () => {
                            // If auto sign-in fails, redirect to sign-in page
                            router.push("/sign-in");
                        },
                    }
                );
            } else {
                toast.error(result.error || "Failed to accept invitation");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setAccepting(false);
        }
    };

    const handleSignIn = async () => {
        if (password.length < 1) {
            toast.error("Please enter your password");
            return;
        }

        setAccepting(true);
        await authClient.signIn.email(
            {
                email: inviteData?.email || "",
                password: password,
            },
            {
                onSuccess: async () => {
                    // After signing in, accept the invite
                    const res = await fetch("/api/auth/accept-admin-invite", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token, existingUser: true }),
                    });
                    const result = await res.json();
                    
                    if (result.success) {
                        toast.success("Welcome to the admin dashboard!");
                        router.push("/");
                    } else {
                        toast.error(result.error || "Failed to accept invitation");
                    }
                    setAccepting(false);
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message || "Failed to sign in");
                    setAccepting(false);
                },
            }
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!inviteData?.valid) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
                <Card className="w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center pt-10">
                        <div className="flex justify-center mb-6">
                            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                <XCircle className="h-12 w-12" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
                        <CardDescription className="text-base pt-2">
                            {inviteData?.error || "This invitation link is invalid, expired, or has already been used."}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center pb-10">
                        <Button 
                            variant="secondary" 
                            className="h-12 px-8 rounded-xl font-semibold"
                            onClick={() => router.push("/sign-in")}
                        >
                            Go to Sign In
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Hero */}
            <div className="relative z-10 text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
                    <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Admin Invitation</h1>
                <p className="text-muted-foreground">
                    You&apos;ve been invited by <span className="text-foreground font-medium">{inviteData.inviterName}</span>
                </p>
            </div>

            {/* Form Card */}
            <Card className="relative z-10 w-full max-w-md border-none shadow-2xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">
                        {mode === "signup" ? "Create Your Account" : "Sign In to Continue"}
                    </CardTitle>
                    <CardDescription>
                        {mode === "signup" 
                            ? "Complete your registration to access the admin dashboard"
                            : "Sign in with your existing account to accept the invitation"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Email Display */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Invitation sent to</p>
                            <p className="font-semibold text-foreground truncate">{inviteData.email}</p>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setMode("signup")}
                            className={cn(
                                "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200",
                                mode === "signup"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Create Account
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("signin")}
                            className={cn(
                                "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200",
                                mode === "signin"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Sign In
                        </button>
                    </div>

                    {mode === "signup" ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10 h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">Create Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator password={password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="signin-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="text-center">
                                <a
                                    href="/reset-password"
                                    className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                                >
                                    Forgot your password?
                                </a>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button
                        className="w-full h-12 font-semibold gap-2"
                        onClick={mode === "signup" ? handleAccept : handleSignIn}
                        disabled={accepting}
                    >
                        {accepting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {mode === "signup" ? "Creating Account..." : "Signing In..."}
                            </>
                        ) : (
                            <>
                                {mode === "signup" ? "Create Account & Join" : "Sign In & Join"}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>

                    {/* Toggle hint */}
                    <div className="text-center">
                        {mode === "signup" ? (
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => setMode("signin")}
                                    className="text-primary font-medium hover:underline underline-offset-4"
                                >
                                    Sign in instead
                                </button>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => setMode("signup")}
                                    className="text-primary font-medium hover:underline underline-offset-4"
                                >
                                    Create one now
                                </button>
                            </p>
                        )}
                    </div>
                </CardFooter>
            </Card>

            <p className="relative z-10 text-muted-foreground text-sm mt-6">
                By accepting, you agree to the Terms of Service and Privacy Policy
            </p>
        </div>
    );
}
