import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookings = await prisma.booking.findMany({
      where: { serviceId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("[Bookings GET]", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const service = await prisma.service.findUnique({
      where: { id },
      select: { allowConcurrentUse: true, requiresBookingApproval: true, ownerId: true }
    });

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (service.allowConcurrentUse) return NextResponse.json({ error: "Service is concurrent-use only" }, { status: 400 });

    const { startDate, endDate, note } = await req.json();

    // Basic overlap check
    const overlap = await prisma.booking.findFirst({
      where: {
        serviceId: id,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          { startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } }
        ]
      }
    });

    if (overlap) {
      return NextResponse.json({ error: "Termín je již obsazen" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        serviceId: id,
        userId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        note,
        status: service.requiresBookingApproval ? "PENDING" : "APPROVED",
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("[Bookings POST]", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
