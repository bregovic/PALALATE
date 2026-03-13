import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Chybějící údaje" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Heslo musí mít aspoň 8 znaků" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Neplatný nebo vypršelý odkaz pro obnovu" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ message: "Heslo bylo úspěšně obnoveno" });
  } catch (err) {
    console.error("[Reset Password Error]", err);
    return NextResponse.json({ error: "Vnitřní chyba serveru" }, { status: 500 });
  }
}
