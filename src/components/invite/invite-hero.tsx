"use client";

import { Buildings, UserCircleGear, Handshake } from "@phosphor-icons/react";

interface InviteHeroProps {
    organizationName: string;
    role: string;
}

export function InviteHero({ organizationName, role }: InviteHeroProps) {
    const getRoleIcon = () => {
        switch (role.toUpperCase()) {
            case "SUPPLIER":
                return <Handshake className="h-5 w-5" weight="duotone" />;
            case "ADMIN":
            case "SUPER_ADMIN":
                return <UserCircleGear className="h-5 w-5" weight="duotone" />;
            default:
                return <Buildings className="h-5 w-5" weight="duotone" />;
        }
    };

    return (
        <div className="flex flex-col items-center text-center space-y-4 mb-8 px-4">
            {/* Logo/Brand Area */}
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Buildings className="h-5 w-5" weight="duotone" />
                <span className="text-sm font-medium tracking-wide uppercase">Invitation</span>
            </div>

            {/* Main Title */}
            <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    You&apos;re Invited to Join
                </h1>
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {organizationName}
                </p>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                {getRoleIcon()}
                <span className="text-sm font-semibold uppercase tracking-wide">
                    {role.replace('_', ' ')}
                </span>
            </div>

            {/* Subtitle */}
            <p className="text-muted-foreground text-sm max-w-sm">
                Complete your account setup below to get started with your new workspace
            </p>
        </div>
    );
}
