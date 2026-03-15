import { Resend } from "resend";
import nodemailer from "nodemailer";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Transporter logic moved inside function
// Hardcoded defaults from working FotoBuddy configuration
const SMTP_DEFAULTS = {
  host: "smtp.gmail.com",
  port: 465,
  user: "ja.nepalalate@gmail.com",
  pass: "dyaangpuyukbkbgb",
  from: "ja.nepalalate@gmail.com"
};

const FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM || SMTP_DEFAULTS.from;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    // 1. Try Resend if fully configured (Highest priority on Railway)
    if (resend && process.env.RESEND_API_KEY) {
      console.log("[Email] Attempting to send via Resend...");
      const { data, error } = await resend.emails.send({
        from: FROM,
        to,
        subject,
        html,
      });

      if (!error) {
        console.log("[Email] Resend success:", data?.id);
        return { success: true, data };
      }
      console.warn("[Email] Resend failed, falling back to SMTP:", error);
    }

    // 2. Fallback to SMTP using Environment variables OR Hardcoded defaults
    const smtpHost = process.env.SMTP_HOST || SMTP_DEFAULTS.host;
    
    if (smtpHost) {
      console.log("[Email] Attempting to send via SMTP (Gmail)...");
      
      const port = parseInt(process.env.SMTP_PORT || String(SMTP_DEFAULTS.port));
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER || SMTP_DEFAULTS.user,
          pass: process.env.SMTP_PASS || SMTP_DEFAULTS.pass,
        },
        // Better timeouts for Railway/Gmail (FotoBuddy pattern)
        connectionTimeout: 20000, 
        greetingTimeout: 20000,
        socketTimeout: 30000,
      });

      const info = await transporter.sendMail({
        from: FROM,
        to,
        subject,
        html,
      });
      console.log("[Email] SMTP success:", info.messageId);
      return { success: true, data: info };
    }

    console.warn("[Email] No email provider configured (missing RESEND_API_KEY or SMTP_HOST)");
    return { success: false, error: "No email provider configured" };
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

  passwordReset: (resetUrl: string) => ({
    subject: "🔑 Obnova hesla - Palalate",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo.png" alt="Palalate" style="height: 48px;" />
        </div>
        <h2 style="color: #a78bfa; text-align: center;">Zapomenuté heslo?</h2>
        <p>Ahoj,</p>
        <p>Dostali jsme žádost o obnovu hesla pro tvůj účet na Palalate. Pokud jsi to nebyl/a ty, můžeš tento email v klidu ignorovat.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Nastavit nové heslo
          </a>
        </div>
        <p style="font-size: 13px; color: #9ca3af; margin-top: 32px;">
          Pokud tlačítko nefunguje, zkopíruj tento odkaz do prohlížeče:<br />
          <span style="word-break: break-all; color: #6d28d9;">${resetUrl}</span>
        </p>
        <hr style="border: 0; border-top: 1px solid #1f2937; margin: 32px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">Palalate – Tvá aplikace pro férové sdílení</p>
      </div>
    `,
  }),

  friendRequestReceived: (
    addresseeName: string,
    requesterName: string,
    contactsUrl: string
  ) => ({
    subject: `👋 Nová žádost o přátelství od ${requesterName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo.png" alt="Palalate" style="height: 48px;" />
        </div>
        <h2 style="color: #a78bfa;">Nová žádost o přátelství</h2>
        <p>Ahoj <strong>${addresseeName}</strong>,</p>
        <p><strong>${requesterName}</strong> si tě chce přidat do kontaktů na Palalate.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${contactsUrl}" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Zobrazit žádost
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">Palalate – Tvá aplikace pro férové sdílení</p>
      </div>
    `,
  }),

  invitationReceived: (
    inviterName: string,
    registerUrl: string,
    message?: string
  ) => ({
    subject: `🥑 Pozvánka do aplikace Palalate od ${inviterName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 40px; border-radius: 20px; border: 1px solid #2d2a3d;">
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="${APP_URL}/logo.png" alt="Palalate" style="height: 56px;" />
        </div>
        <h1 style="color: #a78bfa; text-align: center; font-size: 24px;">Pojď sdílet s námi!</h1>
        <p style="font-size: 16px; line-height: 1.6;">Ahoj!</p>
        <p style="font-size: 16px; line-height: 1.6;"><strong>${inviterName}</strong> tě zve do aplikace <strong>Palalate</strong> – nejlepšího místa pro správu a férové rozpočítání sdílených předplatných (Netflix, Spotify, HBO a další).</p>
        
        ${message ? `
        <div style="background: #1a162e; border-left: 4px solid #7c3aed; padding: 16px; margin: 24px 0; font-style: italic;">
          "${message}"
        </div>
        ` : ''}

        <p style="font-size: 16px; line-height: 1.6;">Zaregistruj se a automaticky se propojíte jako přátelé.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${registerUrl}" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">
            Vytvořit účet
          </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 40px;">
          Palalate – Tvá aplikace pro férové sdílení.
        </p>
      </div>
    `,
  }),
};
