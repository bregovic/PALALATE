import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Palalate <noreply@palalate.app>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const emailTemplates = {
  accessRequestReceived: (
    ownerName: string,
    requesterName: string,
    serviceName: string,
    requestUrl: string
  ) => ({
    subject: `🔔 Nová žádost o přístup ke službě ${serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo.png" alt="Palalate" style="height: 48px;" />
        </div>
        <h2 style="color: #a78bfa;">Nová žádost o přístup</h2>
        <p>Ahoj <strong>${ownerName}</strong>,</p>
        <p><strong>${requesterName}</strong> tě žádá o přístup ke službě <strong>${serviceName}</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${requestUrl}" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Zobrazit žádost
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">Palalate – správa sdílených předplatných</p>
      </div>
    `,
  }),

  accessApproved: (serviceName: string, dashboardUrl: string) => ({
    subject: `✅ Přístup ke službě ${serviceName} byl schválen`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 32px; border-radius: 16px;">
        <h2 style="color: #34d399;">Přístup schválen! 🎉</h2>
        <p>Tvůj přístup ke službě <strong>${serviceName}</strong> byl schválen.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Přejít do aplikace
          </a>
        </div>
      </div>
    `,
  }),

  renewalReminder: (
    ownerName: string,
    serviceName: string,
    renewalDate: string,
    dashboardUrl: string
  ) => ({
    subject: `⏰ Upozornění: Obnova ${serviceName} za 7 dní`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 32px; border-radius: 16px;">
        <h2 style="color: #fbbf24;">Blíží se obnova předplatného</h2>
        <p>Ahoj <strong>${ownerName}</strong>,</p>
        <p>Předplatné <strong>${serviceName}</strong> bude obnoveno <strong>${renewalDate}</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #d97706, #fbbf24); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Spravovat předplatné
          </a>
        </div>
      </div>
    `,
  }),
};
