import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { decryptCredential } from "@/lib/crypto";

// GET /api/services/[id]/credentials/decrypt?cid=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: serviceId } = await params;
    const { searchParams } = new URL(req.url);
    const credentialId = searchParams.get("cid");

    if (!credentialId) return NextResponse.json({ error: "Missing credential ID" }, { status: 400 });

    const credential = await prisma.credentialSecret.findUnique({
      where: { id: credentialId },
      include: { service: true },
    });

    if (!credential || credential.serviceId !== serviceId) {
      return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
    }

    // Access check
    const isOwner = credential.service.ownerId === user.id;
    const isGranted = (await prisma.accessGrant.count({
      where: { serviceId, granteeId: user.id, status: "ACTIVE" }
    })) > 0;

    if (!isOwner && !isGranted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Decrypt
    const data = decryptCredential(credential.encryptedPayload, credential.iv);

    // Audit view
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "CredentialSecret",
        entityId: credential.id,
        action: "VIEW",
        metadata: { serviceId, label: credential.label, requester: user.name },
      },
    });

    // Notify owner if someone else viewed it
    if (!isOwner) {
      await prisma.notification.create({
        data: {
          userId: credential.service.ownerId,
          type: "CREDENTIAL_VIEWED",
          payload: {
            serviceName: credential.service.serviceName,
            requesterName: user.name,
            label: credential.label || credential.secretType,
          },
        },
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/services/[id]/credentials/decrypt]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
