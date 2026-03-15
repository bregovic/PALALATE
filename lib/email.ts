import { Resend } from "resend";
import nodemailer from "nodemailer";


// Transporter logic moved inside function
// Hardcoded defaults from working FotoBuddy configuration
const SMTP_DEFAULTS = {
  host: "smtp.gmail.com",
  port: 587,
  user: "ja.nepalalate@gmail.com",
  pass: "dyaangpuyukbkbgb",
  from: "ja.nepalalate@gmail.com"
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;
  
  const fromAddress = resendKey 
    ? (process.env.SMTP_FROM || "ja.nepalalate@hollyhop.cz") 
    : (process.env.SMTP_FROM || process.env.EMAIL_FROM || SMTP_DEFAULTS.from);

  try {
    console.log("[Email] Initiating send process...");
    console.log("[Email] Resend API Key present:", !!resendKey);
    if (resendKey) {
      console.log("[Email] Key starts with:", resendKey.substring(0, 5) + "...");
    }

    // 1. Try Resend if fully configured (API based - bypasses SMTP blocks)
    if (resend) {
      console.log("[Email] Attempting to send via Resend API...");
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
      });

      if (!error) {
        console.log("[Email] Resend success:", data?.id);
        return { success: true, data };
      }
      
      console.warn("[Email] Resend failed. Error:", JSON.stringify(error));
      
      // On Railway, SMTP is blocked. If Resend fails, don't even try SMTP 
      // so we can see the actual Resend error in the UI instead of a timeout.
      if (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_STATIC_URL) {
        return { 
          success: false, 
          error: `Resend error: ${error.message || JSON.stringify(error)}. (SMTP fallback skipped on Railway to avoid timeout)` 
        };
      }
    } else {
      console.log("[Email] Skipping Resend (no API key found)");
    }

    // 2. Fallback to SMTP (only if Resend wasn't attempted or we're not on Railway)
    const smtpHost = process.env.SMTP_HOST || SMTP_DEFAULTS.host;
    const smtpPort = parseInt(process.env.SMTP_PORT || String(SMTP_DEFAULTS.port));
    
    console.log(`[Email] Attempting to send via SMTP (${smtpHost}:${smtpPort})...`);
    
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER || SMTP_DEFAULTS.user,
        pass: process.env.SMTP_PASS || SMTP_DEFAULTS.pass,
      },
      tls: {
        // This is often needed on restricted environments
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"Palalate" <${process.env.SMTP_USER || SMTP_DEFAULTS.user}>`,
      to,
      subject,
      html,
    });
    
    console.log("[Email] SMTP success:", info.messageId);
    return { success: true, data: info };

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
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 80px;" />
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
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 80px;" />
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
    subject: `Nová žádost o přátelství od ${requesterName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 80px;" />
        </div>
        <h2 style="color: #a78bfa;">Nová žádost o přátelství</h2>
        <p>Ahoj <strong>${addresseeName}</strong>,</p>
        <p><strong>${requesterName}</strong> si tě chce přidat do kontaktů na Palalate.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${contactsUrl}" style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Zobrazit žádost
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">Palalate – místa pro evidenci výdajů za předplatné</p>
      </div>
    `,
  }),
 
  invitationReceived: (
    inviterName: string,
    registerUrl: string,
    message?: string
  ) => ({
    subject: `Pozvánka do aplikace Palalate od ${inviterName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f0d1a; color: #e5e1f0; padding: 40px; border-radius: 20px; border: 1px solid #2d2a3d;">
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 80px;" />
        </div>
        <p style="font-size: 16px; line-height: 1.6;">Ahoj!</p>
        <p style="font-size: 16px; line-height: 1.6;"><strong>${inviterName}</strong> tě zve do aplikace <strong>Palalate</strong> – místa pro evidenci výdajů za předplatné a případné sdílení.</p>
        
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
          Palalate – správa sdílených předplatných
        </p>
      </div>
    `,
  }),
};
