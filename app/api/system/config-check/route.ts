import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    
    // Basic config check (don't reveal actual keys)
    const config = {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      SMTP_HOST: process.env.SMTP_HOST || "not set",
      SMTP_PORT: process.env.SMTP_PORT || "not set",
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM || "not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "not set",
      CREDENTIAL_ENCRYPTION_KEY: !!process.env.CREDENTIAL_ENCRYPTION_KEY,
    };

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
