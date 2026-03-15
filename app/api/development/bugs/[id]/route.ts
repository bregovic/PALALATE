import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  
  // Checking if user is admin to change status, although user asked "měnit stav bugu"
  // without specifying who. Usually it's admin or the one who is assigned.
  // For now, let's allow anyone or restrict to admin? 
  // "A měli bychom tam možnost uživatelů reportovt bugy... A měnit stav bugu"
  // It sounds like users might want to participate. 
  // Let's allow everyone for now as it's a friendly app, or restrict to ADMIN for status changes if it's more formal.
  // Given the "pokec" and "nástěnka" requests, it's a social group app.
  
  const updatedBug = await prisma.bugReport.update({
    where: { id: params.id },
    data: { status },
    include: {
      reporter: { select: { name: true, avatar: true } }
    }
  });

  return NextResponse.json(updatedBug);
}
