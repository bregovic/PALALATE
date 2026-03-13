import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";

// PATCH /api/requests/[id] – approve/reject
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { action, decisionNote, startsAt, endsAt, pricingModel, fixedAmount } = await req.json();

    const request = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, serviceName: true, ownerId: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (request.ownerId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Žádost již byla zpracována" }, { status: 409 });
    }

    if (action === "approve") {
      // Update request
      await prisma.accessRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          decisionNote: decisionNote || null,
          decidedAt: new Date(),
        },
      });

      // Create AccessGrant
      const grant = await prisma.accessGrant.create({
        data: {
          serviceId: request.serviceId,
          granteeId: request.requesterId,
          grantedById: user.id,
          startsAt: startsAt ? new Date(startsAt) : new Date(),
          endsAt: endsAt ? new Date(endsAt) : null,
          status: "ACTIVE",
          pricingModel: pricingModel || "EQUAL_SPLIT",
          fixedAmount: fixedAmount ? parseFloat(fixedAmount) : null,
        },
      });

      // Notify requester
      await prisma.notification.create({
        data: {
          userId: request.requesterId,
          type: "ACCESS_REQUEST_APPROVED",
          payload: {
            grantId: grant.id,
            serviceId: request.serviceId,
            serviceName: request.service.serviceName,
          },
        },
      });

      // Email
      const tmpl = emailTemplates.accessApproved(
        request.service.serviceName,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      );
      sendEmail({ to: request.requester.email, ...tmpl }).catch(console.error);

      return NextResponse.json({ success: true, grant });
    }

    if (action === "reject") {
      await prisma.accessRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          decisionNote: decisionNote || null,
          decidedAt: new Date(),
        },
      });

      await prisma.notification.create({
        data: {
          userId: request.requesterId,
          type: "ACCESS_REQUEST_REJECTED",
          payload: { serviceId: request.serviceId, serviceName: request.service.serviceName },
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PATCH /api/requests/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
