"use client";

import {
  useEffect, useState, useCallback } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock, 
  ArrowRight,
  MessageSquare
} from "lucide-react";
import {
  DashboardLayout,
  SidebarMenuItem,
  Panel,
  SectionHeader,
  StatusBadge,
} from "@/components/dashboard";
import { apiFetchAuth } from "@/lib/api";
import { toast } from "sonner";
import { LayoutDashboard, Users, CreditCard, Settings, History, UserPlus } from "lucide-react";

const adminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Employee Management", href: "/employee-management", icon: UserPlus },
  { label: "Change Requests", href: "/admin/change-requests", icon: MessageSquare },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Payment History", href: "/payment-history", icon: History },
];

export default function ChangeRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetchAuth<any[]>("/employees/change-requests/pending");
      setRequests(data || []);
    } catch (error) {
      toast.error("Failed to load change requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (id: number, status: "Approved" | "Rejected") => {
    try {
      await apiFetchAuth(`/employees/change-requests/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks }),
      });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setRequests(prev => prev.filter(r => r.request_id !== id));
      setReviewingId(null);
      setRemarks("");
    } catch (error) {
      toast.error("Failed to submit review");
    }
  };

  const renderChanges = (oldVal: string, newVal: string) => {
    try {
      const oldObj = JSON.parse(oldVal);
      const newObj = JSON.parse(newVal);
      const changes = Object.keys(newObj).filter(key => 
        JSON.stringify(newObj[key]) !== JSON.stringify(oldObj[key])
      );

      return (
        <div className="space-y-2 mt-2">
          {changes.map(key => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="font-medium text-gray-500 w-32 capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-red-500 line-through truncate max-w-[150px]">{String(oldObj[key] || 'N/A')}</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-green-600 font-medium truncate max-w-[150px]">{String(newObj[key])}</span>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return <p className="text-sm text-gray-500 italic">Complex change payload</p>;
    }
  };

  return (
    <DashboardLayout 
      sidebarItems={adminMenuItems} 
      pageTitle="Profile Change Requests"
    >
      <div className="space-y-6">
        <SectionHeader 
          title="Pending Approvals" 
          description="Review and authorize employee profile updates"
        />

        {loading ? (
          <Panel className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </Panel>
        ) : requests.length === 0 ? (
          <Panel className="text-center py-12 bg-gray-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-1">No pending change requests to review.</p>
          </Panel>
        ) : (
          <div className="grid gap-6">
            {requests.map((request) => (
              <Panel key={request.request_id} className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Employee Info */}
                  <div className="md:w-64 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {request.employees.first_name} {request.employees.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{request.employees.employee_code}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        Submitted {new Date(request.submitted_at).toLocaleDateString()}
                      </div>
                      <StatusBadge status="Pending" />
                    </div>
                  </div>

                  {/* Changes */}
                  <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      Proposed Changes
                    </h4>
                    {renderChanges(request.old_value, request.new_value)}
                    
                    {reviewingId === request.request_id ? (
                      <div className="mt-6 space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                            Review Remarks (Optional)
                          </label>
                          <textarea
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                            rows={2}
                            placeholder="Reason for approval or rejection..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReview(request.request_id, "Approved")}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                          >
                            Confirm Approval
                          </button>
                          <button
                            onClick={() => handleReview(request.request_id, "Rejected")}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                          >
                            Reject Changes
                          </button>
                          <button
                            onClick={() => setReviewingId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setReviewingId(request.request_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                        >
                          Review Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
