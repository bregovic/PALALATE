import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.serviceRegistry.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error("[Service Registry GET]", error);
    return NextResponse.json({ error: "Failed to fetch service registry" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, defaultPrice, currency, billingCycle, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const service = await prisma.serviceRegistry.upsert({
      where: { name },
      update: { category, defaultPrice, currency, billingCycle, description },
      create: { name, category, defaultPrice, currency, billingCycle, description },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("[Service Registry POST]", error);
    return NextResponse.json({ error: "Failed to update service registry" }, { status: 500 });
  }
}
