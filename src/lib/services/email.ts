/**
 * Email Service
 * Handles transactional email sending via Resend (Admin Dashboard)
 */

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || "notifications@materials.infradyn.com";
const REPLY_TO = process.env.RESEND_REPLY_TO;

export interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    if (!RESEND_API_KEY) {
        console.warn("[EMAIL] No RESEND_API_KEY configured, skipping email send");
        return { success: true }; // Don't fail in dev without API key
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
                reply_to: REPLY_TO,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[EMAIL] Send failed:", error);
            return { success: false, error };
        }

        console.log(`[EMAIL] Sent to ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to}`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[EMAIL] Error:", error);
        return { success: false, error: message };
    }
}
