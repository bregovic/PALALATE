import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { encryptCredential } from "@/lib/crypto";

// POST /api/services/[id]/credentials
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: serviceId } = await params;
    const body = await req.json();

    const { secretType, label, value, visibilityRule, note } = body;

    if (!secretType || !value) {
      return NextResponse.json({ error: "Typ a hodnota jsou povinné" }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Služba nenalezena" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Encrypt the value
    const { encryptedPayload, iv } = encryptCredential({ value });

    const credential = await prisma.credentialSecret.create({
      data: {
        serviceId,
        secretType,
        label: label || null,
        encryptedPayload,
        iv,
        visibilityRule: visibilityRule || "OWNER_ONLY",
        note: note || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "CredentialSecret",
        entityId: credential.id,
        action: "CREATE",
        metadata: { serviceId, label },
      },
    });

    return NextResponse.json(credential, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/services/[id]/credentials]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/services/[id]/credentials/decrypt?cid=...
// Dedicated route for decryption with audit logging
