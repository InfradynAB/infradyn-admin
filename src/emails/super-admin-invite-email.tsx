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
                dark: "#0A1C27",
                muted: "#64748b",
              },
            },
          },
        }}
      >
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto py-12 px-4 max-w-xl">
            {/* Header */}
            <Section className="bg-dark rounded-t-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
                <Text className="text-white text-3xl font-bold m-0">I</Text>
              </div>
              <Heading className="text-white text-2xl font-bold m-0">
                INFRADYN
              </Heading>
              <Text className="text-gray-400 text-sm m-0 mt-1">
                Admin Dashboard
              </Text>
            </Section>

            {/* Content */}
            <Section className="bg-white px-8 py-10">
              <Heading className="text-gray-900 text-xl font-semibold mb-4">
                You're Invited as a Super Admin
              </Heading>

              <Text className="text-gray-600 text-base leading-relaxed mb-6">
                {inviterName} has invited you to join the Infradyn Admin Dashboard as a
                Super Admin. As a super admin, you'll have full access to:
              </Text>

              <Section className="bg-gray-50 rounded-lg p-4 mb-6">
                <ul className="text-gray-600 text-sm m-0 pl-4">
                  <li className="mb-2">📊 Platform analytics and KPIs</li>
                  <li className="mb-2">🏢 Organization management</li>
                  <li className="mb-2">👥 User administration</li>
                  <li className="mb-2">🚩 Feature flag controls</li>
                  <li className="mb-2">📝 Audit logs</li>
                  <li>⚙️ System settings</li>
                </ul>
              </Section>

              <Section className="text-center mb-6">
                <Button
                  href={inviteLink}
                  className="bg-primary text-white font-semibold px-8 py-4 rounded-lg text-base no-underline inline-block"
                >
                  Accept Invitation
                </Button>
              </Section>

              <Text className="text-muted text-sm text-center">
                This invitation expires in 7 days.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-gray-50 rounded-b-xl px-8 py-6 text-center">
              <Hr className="border-gray-200 my-4" />
              <Text className="text-muted text-xs m-0">
                This email was sent by Infradyn Admin Dashboard
              </Text>
              <Text className="text-muted text-xs m-0 mt-2">
                If you didn't expect this invitation, you can safely ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
