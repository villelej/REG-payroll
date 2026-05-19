import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "error" | "info" | "default";

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
}

const statusColors: Record<StatusType, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  default: "bg-gray-50 text-gray-700 border-gray-200",
};

// Auto-detect status type from status string
function getStatusType(status: string): StatusType {
  const s = status.toLowerCase();
  if (["active", "paid", "approved", "completed", "success"].includes(s)) {
    return "success";
  }
  if (["pending", "processing", "locked"].includes(s)) {
    return "warning";
  }
  if (["blocked", "rejected", "failed", "inactive", "error"].includes(s)) {
    return "error";
  }
  if (["info", "new"].includes(s)) {
    return "info";
  }
  return "default";
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const statusType = type || getStatusType(status);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        statusColors[statusType],
        className
      )}
    >
      {status}
    </span>
  );
}
