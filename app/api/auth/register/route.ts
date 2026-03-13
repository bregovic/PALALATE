import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SESSION_DURATION_DAYS, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, consent } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Jméno, email a heslo jsou povinné" },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: "Musíte souhlasit s obchodními podmínkami" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Heslo musí mít alespoň 8 znaků" },
        { status: 400 }
      );
    }

    // Diagnostic log for DB connection
    try {
      await prisma.$connect();
    } catch (dbErr) {
      console.error("[Register DB Connection Error]", dbErr);
      return NextResponse.json({ error: "Chyba připojení k databázi" }, { status: 500 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tento email je již registrován" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    // Auto-login after registration
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await prisma.session.create({
      data: { userId: user.id, token, expiresAt },
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { status: 201 });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Register Error Detailed]", err);
    return NextResponse.json({ 
      error: "Vnitřní chyba serveru", 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  }
}
