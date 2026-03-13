import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Současné i nové heslo je povinné" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Nové heslo musí mít alespoň 8 znaků" }, { status: 400 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return NextResponse.json({ error: "Uživatel nenalezen" }, { status: 404 });
    }

    const currentMatches = await bcrypt.compare(currentPassword, fullUser.passwordHash);
    if (!currentMatches) {
      return NextResponse.json({ error: "Současné heslo není správné" }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "Heslo bylo úspěšně změněno" });
  } catch (err) {
    console.error("[Change Password Error]", err);
    return NextResponse.json({ error: "Vnitřní chyba serveru" }, { status: 500 });
  }
}
