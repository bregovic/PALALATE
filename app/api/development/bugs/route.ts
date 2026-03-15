import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admins see all bugs, users see only their own? 
  // User said "vložit výstřižek" and "měnit stav", probably for tracking.
  // Usually, users want to see all reported bugs to avoid duplicates.
  const bugs = await prisma.bugReport.findMany({
    include: {
      reporter: { select: { name: true, avatar: true } }
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bugs);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, screenshot } = await req.json();
  
  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  const bug = await prisma.bugReport.create({
    data: { 
      title, 
      description, 
      screenshot, 
      reporterId: user.id 
    },
    include: {
      reporter: { select: { name: true, avatar: true } }
    }
  });

  return NextResponse.json(bug);
}
