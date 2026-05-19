import { useState, useRef, useEffect } from "react";
import { MoreVertical, CheckCircle, XCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionMenuProps {
  batchId: number;
  status: "Calculated" | "Approved" | "Paid" | string;
  onApprove?: () => void;
  onDeny?: () => void;
  onMarkPaid?: () => void;
  onView?: () => void;
  isLoading?: boolean;
}

export function PaymentActionMenu({
  batchId,
  status,
  onApprove,
  onDeny,
  onMarkPaid,
  onView,
  isLoading = false,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center justify-center"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40 animate-in fade-in zoom-in-95 duration-200">
          <div className="py-1">
            {/* View Action */}
            {onView && (
              <button
                onClick={() => {
                  onView();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 text-blue-600" />
                View Details
              </button>
            )}

            {/* Approve Action - only for Calculated status */}
            {status === "Calculated" && onApprove && (
              <button
                onClick={() => {
                  onApprove();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-blue-600" />
                Approve Batch
              </button>
            )}

            {/* Mark as Paid Action - only for Approved status */}
            {status === "Approved" && onMarkPaid && (
              <button
                onClick={() => {
                  onMarkPaid();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                Mark as Paid
              </button>
            )}

            {/* Deny/Cancel Action - only for Calculated status */}
            {status === "Calculated" && onDeny && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to deny this calculation and cancel the batch?")) {
                      onDeny();
                      setIsOpen(false);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Deny & Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
