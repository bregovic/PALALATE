import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    
    // Only admins or the owner of the workspace can test emails? 
    // For now let's just let any logged in user trigger a test to their own email.
    
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.email || user.email;

    const result = await sendEmail({
      to: targetEmail,
      subject: "🧪 Testovací email z Palalate",
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0f0d1a; color: #e5e1f0; border-radius: 12px;">
          <h2 style="color: #a78bfa;">Email funguje! 🚀</h2>
          <p>Tento email byl odeslán jako test nastavení SMTP/Resend.</p>
          <p><strong>Čas odeslání:</strong> ${new Date().toLocaleString('cs-CZ')}</p>
          <p><strong>Cílová adresa:</strong> ${targetEmail}</p>
          <hr style="border-color: #2d2a3d;" />
          <p style="font-size: 12px; color: #9ca3af;">Odesláno z aplikace Palalate na Railway.</p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Email byl úspěšně odeslán.", data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
