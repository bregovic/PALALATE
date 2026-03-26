import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  // Refetch to get fresh notification settings
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { 
      id: true, name: true, email: true, role: true, bio: true, avatar: true,
      emailNotifyGlobal: true, emailNotifyRequests: true, emailNotifyChat: true,
      emailNotifyNewService: true, emailNotifyGrants: true
    },
  });

  return NextResponse.json(fullUser);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { 
    name, bio, avatar, 
    emailNotifyGlobal, emailNotifyRequests, emailNotifyChat, 
    emailNotifyNewService, emailNotifyGrants 
  } = body;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name ? { name } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
      ...(emailNotifyGlobal !== undefined ? { emailNotifyGlobal } : {}),
      ...(emailNotifyRequests !== undefined ? { emailNotifyRequests } : {}),
      ...(emailNotifyChat !== undefined ? { emailNotifyChat } : {}),
      ...(emailNotifyNewService !== undefined ? { emailNotifyNewService } : {}),
      ...(emailNotifyGrants !== undefined ? { emailNotifyGrants } : {}),
    },
    select: { 
      id: true, name: true, email: true, role: true, bio: true, avatar: true,
      emailNotifyGlobal: true, emailNotifyRequests: true, emailNotifyChat: true,
      emailNotifyNewService: true, emailNotifyGrants: true
    },
  });

  return NextResponse.json(updated);
}
