import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { apiFetchAuth } from "@/lib/api";

interface PaymentNotification {
  id: number;
  batch_id: number;
  batch_code: string;
  type: "pending_approval" | "pending_payment" | "completed";
  message: string;
  period: string;
  total_amount: number;
  created_at: string;
}

interface PaymentNotificationsProps {
  onNavigate?: (batchId: number) => void;
  userRole?: string;
}

export function PaymentNotifications({ onNavigate, userRole }: PaymentNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Only show notifications for super admins and admins
  const shouldShow = userRole && ["SuperAdmin", "PlatformAdmin", "Admin", "CompanyAdmin"].includes(userRole);

  const loadNotifications = async () => {
    if (!shouldShow) return;
    
    setIsLoading(true);
    try {
      const batches = await apiFetchAuth<any[]>("/payroll/batches");
      if (!batches) return;

      const notifs: PaymentNotification[] = [];
      
      batches.forEach((batch, index) => {
        if (batch.status === "Calculated") {
          notifs.push({
            id: index + 1,
            batch_id: batch.batch_id,
            batch_code: batch.batch_code,
            type: "pending_approval",
            message: `Batch ${batch.batch_code} awaiting approval`,
            period: `${new Date(batch.pay_period_start).toLocaleDateString()} - ${new Date(batch.pay_period_end).toLocaleDateString()}`,
            total_amount: Number(batch.total_net_payable),
            created_at: batch.created_at,
          });
        } else if (batch.status === "Approved") {
          notifs.push({
            id: index + 100,
            batch_id: batch.batch_id,
            batch_code: batch.batch_code,
            type: "pending_payment",
            message: `Batch ${batch.batch_code} ready for payment`,
            period: `${new Date(batch.pay_period_start).toLocaleDateString()} - ${new Date(batch.pay_period_end).toLocaleDateString()}`,
            total_amount: Number(batch.total_net_payable),
            created_at: batch.created_at,
          });
        }
      });

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error("Failed to load payment notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldShow) {
      loadNotifications();
      // Poll every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <>
      {/* Bell Icon */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Payment Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {Math.min(unreadCount, 9)}
            </span>
          )}
        </button>

        {/* Notification Drawer */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">Payment Notifications</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-indigo-500 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p>No pending payments</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      onNavigate?.(notif.batch_id);
                      setIsOpen(false);
                    }}
                    className="w-full p-4 hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-3">
                      {notif.type === "pending_approval" ? (
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 group-hover:text-indigo-600">
                          {notif.batch_code}
                        </p>
                        <p className="text-sm text-gray-600">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.period}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {notif.total_amount.toLocaleString()} RWF
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-indigo-600" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    // Navigate to payment processing page
                    window.location.href = "/monthly-payment-processing";
                  }}
                  className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Go to Payment Processing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
