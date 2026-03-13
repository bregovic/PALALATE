import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email je povinný" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // For security, don't reveal if user exists
    if (!user) {
      return NextResponse.json({ message: "Pokud email existuje, instrukce byly odeslány." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    // In a real app, send email here. 
    // For now, we simulate and log it.
    console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);
    console.log(`[PASSWORD RESET] URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`);

    return NextResponse.json({ message: "Pokud email existuje, instrukce byly odeslány." });
  } catch (err) {
    console.error("[Forgot Password Error]", err);
    return NextResponse.json({ error: "Vnitřní chyba serveru" }, { status: 500 });
  }
}
