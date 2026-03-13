import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { encryptCredential } from "@/lib/crypto";

// POST /api/services/[id]/credentials
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id: serviceId } = await params;
    const body = await req.json();

    const { secretType, label, payload, visibilityRule, note } = body;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Služba nenalezena" }, { status: 404 });
    if (service.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!secretType || !payload) {
        return NextResponse.json({ error: "Typ a data jsou povinná" }, { status: 400 });
    }

    const encrypted = encryptCredential(payload);

    let secret;
    try {
      secret = await prisma.credentialSecret.create({
        data: {
          serviceId,
          secretType: secretType as any,
          label: label || null,
          encryptedPayload: encrypted.encryptedPayload,
          iv: encrypted.iv,
          visibilityRule: (visibilityRule || "OWNER_ONLY") as any,
        },
      });
    } catch (dbErr: any) {
      console.error("[DB ERROR credentials create]", dbErr);
      return NextResponse.json({ 
        error: "Chyba databáze při ukládání údajů.", 
        details: dbErr.message,
        code: dbErr.code 
      }, { status: 500 });
    }

    try {
      await prisma.auditLog.create({
          data: {
            actorId: user.id,
            entityType: "CredentialSecret",
            entityId: secret.id,
            action: "CREATE",
            metadata: { serviceId }
          }
      });
    } catch (auditErr) {
      console.error("[AUDIT ERROR credentials create]", auditErr);
      // We don't fail the whole request if audit log fails, but it's good to know
    }

    return NextResponse.json(secret);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/services/[id]/credentials GENERAL ERROR]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
