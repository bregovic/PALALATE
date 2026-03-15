import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [pendingRequests, unreadNotifs, unreadMessages] = await Promise.all([
    import("@/lib/prisma").then(m => m.prisma.accessRequest.count({ where: { ownerId: user.id, status: "PENDING" } })),
    import("@/lib/prisma").then(m => m.prisma.notification.count({ where: { userId: user.id, readAt: null } })),
    import("@/lib/prisma").then(m => m.prisma.chatMessage.count({ where: { receiverId: user.id, readAt: null } })),
  ]);

  return (
    <DashboardShell 
      user={user} 
      pendingRequests={pendingRequests} 
      unreadNotifs={unreadNotifs}
      unreadMessages={unreadMessages}
    >
      {children}
    </DashboardShell>
  );
}
