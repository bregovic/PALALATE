import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    if (user.role !== "ADMIN") {
      // Allow for now as the user requested to see management for all,
      // but in production this should be ADMIN only.
      // return new NextResponse("Unauthorized", { status: 401 });
    }

    const { 
      name, 
      category, 
      defaultPrice, 
      currency, 
      billingCycle, 
      pricingType, 
      isShareable, 
      description,
      usageMode,
      requiresBookingApproval,
      iconUrl,
      url
    } = await req.json();

    // Get old state for propagation
    const oldRegistry = await prisma.serviceRegistry.findUnique({ where: { id } });
    if (!oldRegistry) return new NextResponse("Not found", { status: 404 });

    const service = await prisma.serviceRegistry.update({
      where: { id },
      data: {
        name,
        category,
        defaultPrice: defaultPrice !== undefined ? Number(defaultPrice) : undefined,
        currency,
        billingCycle,
        pricingType,
        isShareable,
        description,
        usageMode,
        requiresBookingApproval,
        iconUrl,
        url
      },
    });

    // PROPAGATION: Update existing user services if registry name or icon changed
    if (name && name !== oldRegistry.name) {
      await prisma.service.updateMany({
        where: { serviceName: oldRegistry.name },
        data: { serviceName: name }
      });
    }

    if (iconUrl && iconUrl !== oldRegistry.iconUrl) {
      // Update icons for services that had the old icon or no icon
      await prisma.service.updateMany({
        where: { 
          serviceName: name || oldRegistry.name,
          OR: [
            { iconUrl: oldRegistry.iconUrl },
            { iconUrl: null }
          ]
        },
        data: { iconUrl }
      });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("PATCH Service Registry Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    // if (user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    await prisma.serviceRegistry.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE Service Registry Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
