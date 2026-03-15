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
  unreadMessages?: number;
  children: React.ReactNode;
}

const LayoutGridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const MessageSquareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const LayoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const navItems = [
  { href: "/dashboard", label: "Přehled", icon: <LayoutGridIcon />, emoji: "🏠" },
  { href: "/dashboard/wall", label: "Nástěnka", icon: <LayoutIcon />, emoji: "📰" },
  { href: "/dashboard/chat", label: "Chat", icon: <MessageSquareIcon />, emoji: "💬" },
  { href: "/dashboard/services", label: "Služby", icon: <CreditCardIcon />, emoji: "💳" },
  { href: "/dashboard/discover", label: "Přátelé", icon: <GlobeIcon />, emoji: "🌍" },
  { href: "/dashboard/wishes", label: "Přání", icon: <StarIcon />, emoji: "✨" },
  { href: "/dashboard/costs", label: "Náklady", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ), emoji: "📊" },
  { href: "/dashboard/contacts", label: "Kontakty", icon: <UsersIcon />, emoji: "👥" },
];

export default function DashboardShell({ 
  user, 
  pendingRequests, 
  unreadNotifs, 
  unreadMessages = 0,
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
            item.href === "/dashboard/notifications" ? unreadNotifs : 
            item.href === "/dashboard/chat" ? unreadMessages : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? "active" : ""}`}
            >
              <div className="mobile-nav-icon">{item.icon}</div>
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
