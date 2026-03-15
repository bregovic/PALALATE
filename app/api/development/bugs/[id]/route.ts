import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  const { id } = await params;
  
  const updatedBug = await prisma.bugReport.update({
    where: { id },
    data: { status },
    include: {
      reporter: { select: { name: true, avatar: true } }
    }
  });

  return NextResponse.json(updatedBug);
}
