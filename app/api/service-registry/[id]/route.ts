import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      // Allow for now as the user requested to see management for all,
      // but in production this should be ADMIN only.
      // return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const { 
      name, 
      category, 
      defaultPrice, 
      currency, 
      billingCycle, 
      pricingType, 
      isShareable, 
      description,
      allowConcurrentUse,
      requiresBookingApproval
    } = await req.json();

    const service = await prisma.serviceRegistry.update({
      where: { id },
      data: {
        name,
        category,
        defaultPrice: parseFloat(defaultPrice),
        currency,
        billingCycle,
        pricingType,
        isShareable,
        description,
        allowConcurrentUse: allowConcurrentUse !== undefined ? allowConcurrentUse : undefined,
        requiresBookingApproval: requiresBookingApproval !== undefined ? requiresBookingApproval : undefined,
      },
    });

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
    // if (user.role !== "ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    await prisma.serviceRegistry.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE Service Registry Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
