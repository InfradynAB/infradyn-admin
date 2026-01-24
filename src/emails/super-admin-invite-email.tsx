import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface SuperAdminInviteEmailProps {
    inviteLink: string;
    inviterName?: string;
}

export default function SuperAdminInviteEmail({
    inviteLink = "http://localhost:3000/invite/token",
    inviterName = "Admin",
}: SuperAdminInviteEmailProps) {
    const previewText = "You've been invited as a Super Admin on Infradyn";

    return (
        <Html>
            <Head>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                `}</style>
            </Head>
            <Preview>{previewText}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                primary: "#0F6157",
                                accent: "#0066CC",
                                navy: "#1d1d1f",
                                muted: "#86868b",
                            },
                        },
                    },
                }}
            >
                <Body className="bg-white my-0 mx-auto font-sans">
                    {/* Main Content Area */}
                    <Container className="max-w-[680px] mx-auto px-[40px] pt-[50px] pb-[40px]">
                        {/* Logo */}
                        <Section className="mb-[40px]">
                            <Img
                                src="https://materials.infradyn.com/logos/logo.png"
                                width="140"
                                height="auto"
                                alt="Infradyn"
                                className="m-0"
                            />
                        </Section>

                        {/* Greeting */}
                        <Heading className="text-navy text-[28px] font-semibold tracking-tight m-0 mb-[24px]">
                            Hello,
                        </Heading>

                        {/* Body Copy */}
                        <Text className="text-navy text-[17px] leading-[1.6] m-0 mb-[20px]">
                            {inviterName} has invited you to join Infradyn as a <strong>Super Admin</strong>.
                        </Text>

                        <Text className="text-navy text-[17px] leading-[1.6] m-0 mb-[20px]">
                            As a Super Admin, you will have full access to manage organizations, users, feature flags, and platform settings across the entire Infradyn platform.
                        </Text>

                        {/* CTA Button */}
                        <Section className="text-center my-[32px]">
                            <Button
                                href={inviteLink}
                                className="bg-[#0F6157] text-white text-[16px] font-semibold py-[14px] px-[32px] rounded-[8px] no-underline inline-block"
                            >
                                Accept Invitation
                            </Button>
                        </Section>

                        <Text className="text-navy text-[17px] leading-[1.6] m-0 mb-[20px]">
                            This invitation will expire in <strong>7 days</strong>.
                        </Text>

                        {/* Divider */}
                        <Hr className="border-0 border-t border-solid border-[#d2d2d7] my-[32px]" />

                        {/* Security Notice */}
                        <Text className="text-muted text-[12px] leading-[1.5] m-0 mb-[20px]">
                            This invitation was intended for you. If you were not expecting this invitation, you can safely ignore this email.
                        </Text>

                        <Text className="text-muted text-[12px] leading-[1.5] m-0">
                            If the button above does not work, copy and paste this URL into your browser:
                        </Text>
                        <Text className="text-accent text-[12px] leading-[1.5] m-0 break-all">
                            {inviteLink}
                        </Text>
                    </Container>

                    {/* Footer */}
                    <Container className="max-w-[680px] mx-auto bg-[#f5f5f7] px-[40px] py-[24px]">
                        <Text className="text-muted text-[12px] leading-[1.5] m-0 text-center">
                            © 2025 Infradyn. All rights reserved.
                        </Text>
                        <Text className="text-muted text-[12px] leading-[1.5] m-0 text-center">
                            Materials Tracking & Procurement Platform
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
