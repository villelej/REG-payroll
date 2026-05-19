"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, User, LogOut, Settings } from "lucide-react";
import { NotificationCenter } from "./notification-center";
import { PaymentNotifications } from "./payment-notifications";
import { logout, getLoggedUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface TopNavbarProps {
  pageTitle: string;
  userName?: string;
  onMobileMenuToggle: () => void;
}

export function TopNavbar({
  pageTitle,
  userName,
  onMobileMenuToggle,
}: TopNavbarProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const user = getLoggedUser();
    if (user?.role) {
      setUserRole(user.role);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handlePaymentNotificationClick = (batchId: number) => {
    // Navigate to payment processing page
    router.push(`/monthly-payment-processing?batchId=${batchId}`);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-all duration-300",
        isScrolled
          ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50"
          : "bg-transparent"
      )}
    >
      <div className="px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Mobile menu & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                {pageTitle}
              </h1>
              {userName && (
                <p className="text-sm text-indigo-600 font-medium">
                  Welcome back, {userName}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Notifications & Profile */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notifications */}
            <NotificationCenter />

            {/* Payment Notifications */}
            <PaymentNotifications 
              onNavigate={handlePaymentNotificationClick}
              userRole={userRole}
            />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {userName || "User"}
                </span>
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
