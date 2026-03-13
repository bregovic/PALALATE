import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { name, note } = await req.json();

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const slot = await prisma.manualSlot.create({
      data: {
        serviceId: id,
        name,
        note
      }
    });

    return NextResponse.json(slot);
  } catch (err) {
    console.error("[POST manual-slots]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const user = await requireAuth();
      const { searchParams } = new URL(req.url);
      const slotId = searchParams.get("slotId");
      const { id } = await params;
  
      if (!slotId) return NextResponse.json({ error: "Missing slotId" }, { status: 400 });
  
      const service = await prisma.service.findUnique({ where: { id } });
      if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
      if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
      await prisma.manualSlot.delete({
        where: { id: slotId }
      });
  
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[DELETE manual-slots]", err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
