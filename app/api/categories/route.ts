import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[Categories GET]", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json();
    const { name, icon } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const category = await prisma.serviceCategory.upsert({
      where: { name },
      update: { icon },
      create: { name, icon },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("[Categories POST]", error);
    return NextResponse.json({ error: "Failed to update categories" }, { status: 500 });
  }
}
