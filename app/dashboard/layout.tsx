import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [pendingRequests, unreadNotifs] = await Promise.all([
    import("@/lib/prisma").then(m => m.prisma.accessRequest.count({ where: { ownerId: user.id, status: "PENDING" } })),
    import("@/lib/prisma").then(m => m.prisma.notification.count({ where: { userId: user.id, readAt: null } })),
  ]);

  return (
    <div className="app-shell">
      <Sidebar user={user} pendingRequests={pendingRequests} unreadNotifs={unreadNotifs} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
