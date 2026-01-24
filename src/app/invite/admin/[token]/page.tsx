"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XCircle, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
                toast.success("Account created successfully!");
                router.push("/sign-in");
            } else {
                toast.error(result.error || "Failed to accept invitation");
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0A1C27] via-[#0F6157]/20 to-[#0A1C27]">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (!inviteData?.valid) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0A1C27] via-[#0F6157]/20 to-[#0A1C27] p-6">
                <Card className="w-full max-w-md border-none shadow-2xl">
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0A1C27] via-[#0F6157]/20 to-[#0A1C27] p-6">
            {/* Hero */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F6157] rounded-2xl mb-4">
                    <Shield className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Super Admin Invitation</h1>
                <p className="text-gray-400">
                    You have been invited by <span className="text-white font-medium">{inviteData.inviterName}</span>
                </p>
            </div>

            {/* Form Card */}
            <Card className="w-full max-w-md border-none shadow-2xl">
                <CardHeader>
                    <CardTitle>Create Your Account</CardTitle>
                    <CardDescription>
                        Complete your registration to access the admin dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={inviteData.email || ""}
                            disabled
                            className="bg-muted"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full bg-[#0F6157] hover:bg-[#0d5048] h-12"
                        onClick={handleAccept}
                        disabled={accepting}
                    >
                        {accepting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            "Accept & Create Account"
                        )}
                    </Button>
                </CardFooter>
            </Card>

            <p className="text-gray-500 text-sm mt-6">
                By accepting, you agree to the Terms of Service and Privacy Policy
            </p>
        </div>
    );
}
