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
          aria-label="Otevřít menu"
          style={{ flexShrink: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        
        {/* Centered logo – links to home */}
        <Link 
          href="/dashboard" 
          style={{ 
            position: "absolute", 
            left: "50%", 
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "44px",
          }}
        >
          <Image 
            src="/logo.png" 
            alt="Palalate" 
            width={110} 
            height={38} 
            style={{ objectFit: 'contain', maxHeight: 38 }} 
            priority
          />
        </Link>
        
        <div style={{ width: 40, flexShrink: 0 }} /> {/* Right spacer for balance */}
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
