import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { ids, usageMode } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0 || !usageMode) {
      return NextResponse.json({ error: "Chybějící data pro hromadnou úpravu" }, { status: 400 });
    }

    // Verify ownership and update
    const updated = await prisma.service.updateMany({
      where: {
        id: { in: ids },
        ownerId: user.id
      },
      data: {
        usageMode,
        // Automatically adjust sharingStatus if needed?
        sharingStatus: usageMode === "PRIVATE" ? "SHARING_DISABLED" : "SHARING_ENABLED"
      }
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (err) {
    console.error("[Bulk API]", err);
    return NextResponse.json({ error: "Chyba při hromadné úpravě" }, { status: 500 });
  }
}
