"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBannerProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
}

const styles = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function NotificationBanner({
  type,
  message,
  onClose,
}: NotificationBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 rounded-lg border mb-4",
        styles[type]
      )}
    >
      <p className="text-sm font-medium whitespace-pre-wrap">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
