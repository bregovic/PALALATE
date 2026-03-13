"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface DashboardShellProps {
  user: any;
  pendingRequests: number;
  unreadNotifs: number;
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Přehled", emoji: "🏠" },
  { href: "/dashboard/services", label: "Mé služby", emoji: "💳" },
  { href: "/dashboard/discover", label: "Sdílení přátel", emoji: "🌍" },
  { href: "/dashboard/wishes", label: "Přání", emoji: "✨" },
  { href: "/dashboard/costs", label: "Náklady", emoji: "📊" },
  { href: "/dashboard/contacts", label: "Kontakty", emoji: "👥" },
  { href: "/dashboard/requests", label: "Žádosti", emoji: "📥" },
  { href: "/dashboard/settlements", label: "Vyúčtování", emoji: "💰" },
  { href: "/dashboard/notifications", label: "Notif.", emoji: "🔔" },
  { href: "/dashboard/settings", label: "Nastavení", emoji: "⚙️" },
];

export default function DashboardShell({ 
  user, 
  pendingRequests, 
  unreadNotifs, 
  children 
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="app-shell">
      {/* Mobile Topbar */}
      <header className="mobile-header">
        <button 
          className="btn btn-ghost btn-icon" 
          onClick={() => setIsSidebarOpen(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        
        <Link href="/dashboard" className="flex items-center">
          <Image src="/logo.png" alt="Palalate" width={100} height={40} style={{ objectFit: 'contain' }} />
        </Link>
        
        <div style={{ width: 40 }} /> {/* Spacer to center logo */}
      </header>

      {/* Mobile horizontal scroll nav */}
      <nav className="mobile-bottom-nav" aria-label="Mobilní navigace">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const badge =
            item.href === "/dashboard/requests" ? pendingRequests :
            item.href === "/dashboard/notifications" ? unreadNotifs : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="mobile-nav-emoji">{item.emoji}</span>
              <span className="mobile-nav-label">{item.label}</span>
              {badge > 0 && <span className="mobile-nav-badge">{badge}</span>}
            </Link>
          );
        })}
      </nav>

      <Sidebar 
        user={user} 
        pendingRequests={pendingRequests} 
        unreadNotifs={unreadNotifs} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
