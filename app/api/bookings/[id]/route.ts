import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Only owner can approve/reject
    if (booking.service.ownerId !== user.id) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Booking PATCH]", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
