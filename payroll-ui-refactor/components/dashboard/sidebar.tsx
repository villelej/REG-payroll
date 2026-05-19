"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  title: string;
  subtitle: string;
  menuItems: SidebarMenuItem[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  title,
  subtitle,
  menuItems,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Mobile close button */}
      <button
        onClick={onMobileClose}
        className="lg:hidden absolute top-4 right-4 p-1 rounded-md hover:bg-slate-800 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Brand section */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="w-full h-16 bg-white rounded-lg flex items-center justify-center mb-4 shadow-lg overflow-hidden p-2">
          <img src="/reg.png" alt="REG Logo" className="max-h-full max-w-full object-contain" />
        </div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-indigo-400 text-sm font-medium">{subtitle}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
