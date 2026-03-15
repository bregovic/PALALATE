import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.update({
      where: { email: "admin@palalate.cz" },
      data: { role: "ADMIN" }
    });
    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}
