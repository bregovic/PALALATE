import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { cache } from "react";

export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("palalate_session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatar: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export const SESSION_COOKIE = "palalate_session";
export const SESSION_DURATION_DAYS = 30;
