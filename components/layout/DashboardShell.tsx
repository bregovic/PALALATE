"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";
import Image from "next/image";

interface DashboardShellProps {
  user: any;
  pendingRequests: number;
  unreadNotifs: number;
  children: React.ReactNode;
}

export default function DashboardShell({ 
  user, 
  pendingRequests, 
  unreadNotifs, 
  children 
}: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
