"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CircleNotch, Eye, EyeSlash, ArrowRight, User, Lock, CheckCircle } from "@phosphor-icons/react";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength";
import { cn } from "@/lib/utils";
import { acceptInvitation } from "@/lib/actions/invitation";

interface InviteAuthFormProps {
    email: string;
    token: string;
    onSuccess: () => void;
}

const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const signInSchema = z.object({
    password: z.string().min(1, "Password is required"),
});

export function InviteAuthForm({ email, token, onSuccess }: InviteAuthFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"signup" | "signin">("signup");
    const [statusMessage, setStatusMessage] = useState("");

    // Password visibility states
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- Sign Up Form ---
    const signUpForm = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { name: "", password: "", confirmPassword: "" },
    });

    // --- Sign In Form ---
    const signInForm = useForm<z.infer<typeof signInSchema>>({
        resolver: zodResolver(signInSchema),
        defaultValues: { password: "" },
    });

    // Complete the invite acceptance flow
    async function completeInviteAcceptance() {
        setStatusMessage("Joining workspace...");
        
        // Small delay to ensure session cookie is set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh to get new session
        router.refresh();
        
        // Another small delay after refresh
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
            const result = await acceptInvitation(token);
            if (result.success) {
                toast.success("Welcome! Redirecting to your dashboard...");
                // Use window.location.assign for a full page reload to ensure session is recognized
                const redirectUrl = result.role === "SUPPLIER" 
                    ? "/dashboard/supplier/onboarding" 
                    : "/";
                window.location.assign(redirectUrl);
            } else {
                toast.error(result.error || "Failed to join. Please try again.");
                setIsLoading(false);
                setStatusMessage("");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
            setIsLoading(false);
            setStatusMessage("");
        }
    }

    async function onSignUp(values: z.infer<typeof signUpSchema>) {
        setIsLoading(true);
        setStatusMessage("Creating your account...");
        
        await authClient.signUp.email(
            {
                email: email,
                password: values.password,
                name: values.name,
            },
            {
                onSuccess: async () => {
                    setStatusMessage("Account created! Signing you in...");
                    // Now sign in
                    await authClient.signIn.email(
                        {
                            email: email,
                            password: values.password,
                        },
                        {
                            onSuccess: async () => {
                                await completeInviteAcceptance();
                            },
                            onError: (ctx) => {
                                toast.error(ctx.error.message || "Account created but sign-in failed. Please sign in manually.");
                                setIsLoading(false);
                                setStatusMessage("");
                                setMode("signin");
                            },
                        }
                    );
                },
                onError: (ctx) => {
                    // Check if user already exists
                    if (ctx.error.message?.toLowerCase().includes("already exists") || 
                        ctx.error.message?.toLowerCase().includes("email")) {
                        toast.error("An account with this email already exists. Please sign in.");
                        setMode("signin");
                    } else {
                        toast.error(ctx.error.message || "Failed to create account");
                    }
                    setIsLoading(false);
                    setStatusMessage("");
                },
            }
        );
    }

    async function onSignIn(values: z.infer<typeof signInSchema>) {
        setIsLoading(true);
        setStatusMessage("Signing you in...");
        
        await authClient.signIn.email(
            {
                email: email,
                password: values.password,
            },
            {
                onSuccess: async () => {
                    await completeInviteAcceptance();
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message || "Failed to sign in");
                    setIsLoading(false);
                    setStatusMessage("");
                },
            }
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Email Display */}
            <div className="relative">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-primary" weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Invitation sent to</p>
                        <p className="font-semibold text-foreground truncate">{email}</p>
                    </div>
                </div>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/5 rounded-lg border border-primary/10">
                    <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">{statusMessage}</span>
                </div>
            )}

            {/* Mode Toggle */}
            {!isLoading && (
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
            )}

            {/* Sign Up Form */}
            {mode === "signup" && !isLoading && (
                <Form {...signUpForm}>
                    <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                        <FormField
                            control={signUpForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter your full name"
                                                className="pl-10 h-11"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Create Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a strong password"
                                                className="pl-10 pr-10 h-11"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeSlash className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <PasswordStrengthIndicator password={field.value} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={signUpForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                className="pl-10 pr-10 h-11"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeSlash className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full h-11 font-semibold gap-2"
                            disabled={isLoading}
                        >
                            Create Account & Join
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </form>
                </Form>
            )}

            {/* Sign In Form */}
            {mode === "signin" && !isLoading && (
                <Form {...signInForm}>
                    <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
                        <FormField
                            control={signInForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                className="pl-10 pr-10 h-11"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeSlash className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full h-11 font-semibold gap-2"
                            disabled={isLoading}
                        >
                            Sign In & Join
                            <ArrowRight className="h-4 w-4" />
                        </Button>

                        <div className="text-center">
                            <a
                                href="/reset-password"
                                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                            >
                                Forgot your password?
                            </a>
                        </div>
                    </form>
                </Form>
            )}

            {/* Toggle hint */}
            {!isLoading && (
                <div className="text-center pt-2">
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
            )}
        </div>
    );
}
