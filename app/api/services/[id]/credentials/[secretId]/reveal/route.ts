import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { decryptCredential } from "@/lib/crypto";

// GET /api/services/[id]/credentials/[secretId]/reveal
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string, secretId: string }> }) {
  try {
    const user = await requireAuth();
    const { id: serviceId, secretId } = await params;

    const secret = await prisma.credentialSecret.findUnique({
      where: { id: secretId },
      include: { service: true }
    });

    if (!secret || secret.serviceId !== serviceId) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 });
    }

    // Access check
    const isOwner = secret.service.ownerId === user.id;
    let isAllowed = isOwner;

    if (!isAllowed && secret.visibilityRule === "GRANTED_USERS") {
      const grant = await prisma.accessGrant.findFirst({
        where: { serviceId, granteeId: user.id, status: "ACTIVE" }
      });
      if (grant) isAllowed = true;
    }

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const decrypted = decryptCredential(secret.encryptedPayload, secret.iv);

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "CredentialSecret",
        entityId: secretId,
        action: "VIEW",
        metadata: { serviceId }
      }
    });

    return NextResponse.json(decrypted);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET reveal credential]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
