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

  } catch (err) {
    console.error("[Email] Unexpected error:", err);
    return { success: false, error: err };
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const sharedStyles = `
  background: #f8fafc; 
  color: #0f172a; 
  padding: 40px; 
  border-radius: 20px; 
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const buttonGradient = "linear-gradient(135deg, #3b82f6, #2563eb)";
const buttonShadow = "0 4px 12px rgba(37, 99, 235, 0.2)";

export const emailTemplates = {
  accessRequestReceived: (
    ownerName: string,
    requesterName: string,
    serviceName: string,
    requestUrl: string
  ) => ({
    subject: `🔔 Nová žádost o přístup ke službě ${serviceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; ${sharedStyles}">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 60px;" />
        </div>
        <h2 style="color: #1e40af; text-align: center;">Nová žádost o přístup</h2>
        <p>Ahoj <strong>${ownerName}</strong>,</p>
        <p><strong>${requesterName}</strong> tě žádá o přístup ke službě <strong>${serviceName}</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${requestUrl}" style="background: ${buttonGradient}; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: ${buttonShadow}; display: inline-block;">
            Zobrazit žádost
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">Palalate – správa sdílených předplatných</p>
      </div>
    `,
  }),

  accessApproved: (serviceName: string, dashboardUrl: string) => ({
    subject: `✅ Přístup ke službě ${serviceName} byl schválen`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; ${sharedStyles}">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 60px;" />
        </div>
        <h2 style="color: #059669; text-align: center;">Přístup schválen! 🎉</h2>
        <p>Tvůj přístup ke službě <strong>${serviceName}</strong> byl schválen.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); display: inline-block;">
            Přejít do aplikace
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">Palalate – správa sdílených předplatných</p>
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
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; ${sharedStyles}">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 60px;" />
        </div>
        <h2 style="color: #d97706; text-align: center;">Blíží se obnova předplatného</h2>
        <p>Ahoj <strong>${ownerName}</strong>,</p>
        <p>Předplatné <strong>${serviceName}</strong> bude obnoveno <strong>${renewalDate}</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); display: inline-block;">
            Spravovat předplatné
          </a>
        </div>
      </div>
    `,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: "🔑 Obnova hesla - Palalate",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; ${sharedStyles}">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 60px;" />
        </div>
        <h2 style="color: #1e40af; text-align: center;">Zapomenuté heslo?</h2>
        <p>Ahoj,</p>
        <p>Dostali jsme žádost o obnovu hesla pro tvůj účet na Palalate. Pokud jsi to nebyl/a ty, můžeš tento email v klidu ignorovat.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: ${buttonGradient}; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: ${buttonShadow}; display: inline-block;">
            Nastavit nové heslo
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 32px; text-align: center;">
          Pokud tlačítko nefunguje, zkopíruj tento odkaz do prohlížeče:<br />
          <span style="word-break: break-all; color: #3b82f6;">${resetUrl}</span>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Palalate – Tvá aplikace pro férové sdílení</p>
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
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; ${sharedStyles}">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 60px;" />
        </div>
        <h2 style="color: #1e40af; text-align: center;">Nová žádost o přátelství</h2>
        <p>Ahoj <strong>${addresseeName}</strong>,</p>
        <p><strong>${requesterName}</strong> si tě chce přidat do kontaktů na Palalate.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${contactsUrl}" style="background: ${buttonGradient}; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: ${buttonShadow}; display: inline-block;">
            Zobrazit žádost
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">Palalate – místa pro evidenci výdajů za předplatné</p>
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
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; ${sharedStyles}">
        <div style="text-align: center; margin-bottom: 40px;">
          <img src="${APP_URL}/logo_sent.png?v=2" alt="Palalate" style="height: 80px;" />
        </div>
        <p style="font-size: 16px; line-height: 1.6;">Ahoj!</p>
        <p style="font-size: 16px; line-height: 1.6;"><strong>${inviterName}</strong> tě zve do aplikace <strong>Palalate</strong> – místa pro evidenci výdajů za předplatné a případné sdílení.</p>
        
        ${message ? `
        <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; font-style: italic; color: #475569;">
          "${message}"
        </div>
        ` : ''}
 
        <p style="font-size: 16px; line-height: 1.6;">Zaregistruj se a automaticky se propojíte jako přátelé.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${registerUrl}" style="background: ${buttonGradient}; color: white; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: ${buttonShadow}; display: inline-block;">
            Vytvořit účet
          </a>
        </div>

        <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 16px;">📲 Instaluj jako aplikaci:</p>
          <div style="display: flex; justify-content: center; gap: 20px;">
             <a href="${APP_URL}/dashboard/settings" style="text-decoration: none; display: inline-block; padding: 10px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; font-size: 13px; font-weight: 600;">
                <img src="${APP_URL}/and-logo.png" style="height: 16px; vertical-align: middle; margin-right: 8px;" /> Android (Kliknout)
             </a>
             <div style="display: inline-block; padding: 10px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; font-size: 13px; font-weight: 600;">
                🍏 iOS (Safari -> Sdílet)
             </div>
          </div>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 48px;">
          Palalate – správa sdílených předplatných
        </p>
      </div>
    `,
  }),
};
