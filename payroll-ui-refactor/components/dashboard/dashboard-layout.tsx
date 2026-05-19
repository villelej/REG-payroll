"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar, SidebarProps } from "./sidebar";
import { TopNavbar } from "./top-navbar";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarConfig: SidebarProps;
  pageTitle: string;
  userName?: string;
}

export function DashboardLayout({
  children,
  sidebarConfig,
  pageTitle,
  userName,
}: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        {...sidebarConfig}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="lg:pl-64">
        <TopNavbar
          pageTitle={pageTitle}
          userName={userName}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
