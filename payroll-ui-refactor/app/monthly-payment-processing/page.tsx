"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  History,
  UserPlus,
  RefreshCw,
  Wallet,
  CheckCircle,
  Loader2,
  Search,
  X,
  ShieldCheck,
  Scissors,
  MapPin,
  List,
} from "lucide-react";
import { DashboardLayout, SidebarMenuItem, Panel, MetricCard, SectionHeader } from "@/components/dashboard";
import { PaymentActionMenu } from "@/components/dashboard/payment-action-menu";
import { BatchDetailsModal } from "@/components/dashboard/batch-details-modal";
import { NotificationBanner } from "@/components/notification-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoggedUser, isRoleAllowedForRoute } from "@/lib/auth";
import { apiFetchAuth } from "@/lib/api";

const adminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Employee Management", href: "/employee-management", icon: UserPlus },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Payment History", href: "/payment-history", icon: History },
];

const superAdminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/super-admin-dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/user-management", icon: Users },
  { label: "Role Management", href: "/role-management", icon: ShieldCheck },
  { label: "Payment History", href: "/payment-history", icon: History },
  { label: "Salary Deductions", href: "/salary-deductions", icon: Scissors },
  { label: "Branch Management", href: "/branch-management", icon: MapPin },
  { label: "Category Management", href: "/category-management", icon: List },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
];

export default function MonthlyPaymentProcessingPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [payrollBatches, setPayrollBatches] = useState<any[]>([]);
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
  const [selectedEligibleIds, setSelectedEligibleIds] = useState<Set<number>>(new Set());
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [isFetchingEligible, setIsFetchingEligible] = useState(false);
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Distribution Workflow
  const [isDistModalOpen, setIsDistModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [distForm, setDistForm] = useState({ bankName: "", accountNumber: "" });
  const [userPin, setUserPin] = useState("");
  const [processingType, setProcessingType] = useState<"selected" | "all">("selected");

  // Batch Details Modal
  const [selectedBatchForDetails, setSelectedBatchForDetails] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadPayrollData = useCallback(async () => {
    setIsFetchingEligible(true);
    try {
      const [batches, eligible] = await Promise.all([
        apiFetchAuth<any[]>("/payroll/batches"),
        apiFetchAuth<any[]>("/payroll/eligible", {
          method: "POST",
          body: JSON.stringify({ month: payrollForm.month, year: payrollForm.year })
        })
      ]);
      if (batches) setPayrollBatches(batches);
      if (eligible) setEligibleEmployees(eligible);
      setSelectedEligibleIds(new Set());
    } catch (err) {
      console.error("Failed to load payroll data:", err);
    } finally {
      setIsFetchingEligible(false);
    }
  }, [payrollForm]);

  const handleBatchAction = async (batchId: number, action: 'approve' | 'pay' | 'cancel') => {
    try {
      await apiFetchAuth(`/payroll/batches/${batchId}/${action}`, {
        method: "PATCH",
      });
      showNotification("success", `Batch ${action === 'approve' ? 'approved' : action === 'cancel' ? 'cancelled' : 'marked as paid'} successfully.`);
      loadPayrollData();
    } catch (err) {
      showNotification("error", `Failed to ${action} batch.`);
    }
  };

  useEffect(() => {
    const user = getLoggedUser();
    if (!user || !isRoleAllowedForRoute(user.role || "", "/admin-dashboard")) {
      router.replace("/");
      return;
    }
    setUserName(user.fullName || user.username || user.email || "Admin");
    setUserRole(user.role || "");
    loadPayrollData();
  }, [router, loadPayrollData]);

  const handlePaySelected = () => {
    if (selectedEligibleIds.size === 0) return;
    setProcessingType("selected");
    setIsDistModalOpen(true);
  };

  const handlePayAll = () => {
    if (eligibleEmployees.length === 0) return;
    setProcessingType("all");
    setIsDistModalOpen(true);
  };

  const finalizePayroll = async () => {
    setIsProcessingPayroll(true);
    setIsPinModalOpen(false);
    try {
      await apiFetchAuth("/payroll/run", {
        method: "POST",
        body: JSON.stringify({
          month: payrollForm.month,
          year: payrollForm.year,
          employeeIds: processingType === "selected" ? Array.from(selectedEligibleIds) : undefined,
          distributionBank: distForm.bankName,
          distributionAccount: distForm.accountNumber,
          totalAmount: totalPayout,
        })
      });
      showNotification("success", `Payroll processed successfully.`);
      loadPayrollData();
      setIsDistModalOpen(false);
      setDistForm({ bankName: "", accountNumber: "" });
      setUserPin("");
    } catch (err) {
      showNotification("error", "Failed to process payroll");
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const filteredEligible = eligibleEmployees.filter((e) => {
    const name = ((e.full_name || e.name || "") as string).toLowerCase();
    return name.includes(eligibleSearch.toLowerCase());
  });

  const totalPayout = filteredEligible
    .filter(e => (processingType === "all" ? e.status === "Eligible" : selectedEligibleIds.has(e.user_id || e.id)))
    .reduce((acc, e) => acc + Number(e.netSalary || e.net_salary || 0), 0);

  return (
    <DashboardLayout
      sidebarConfig={{
        title: "Reserve Force Payroll",
        subtitle: userRole === "SuperAdmin" || userRole === "PlatformAdmin" ? "Super Admin Portal" : "Admin Portal",
        menuItems: userRole === "SuperAdmin" || userRole === "PlatformAdmin" ? superAdminMenuItems : adminMenuItems,
      }}
      pageTitle="Payment Processing"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <SectionHeader
        title="Monthly Payment Processing"
        description="Run payroll and process payments for eligible employees"
      />

      <Panel title="Payroll Controls">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-3 items-center">
            <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <select
                value={payrollForm.month}
                onChange={(e) => setPayrollForm({ ...payrollForm, month: Number(e.target.value) })}
                className="border-none bg-transparent px-3 py-2 text-sm font-medium focus:ring-0"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={payrollForm.year}
                onChange={(e) => setPayrollForm({ ...payrollForm, year: Number(e.target.value) })}
                className="border-none bg-transparent px-3 py-2 text-sm font-medium w-20 border-l border-gray-300 focus:ring-0"
              />
            </div>
            <Button variant="outline" onClick={loadPayrollData} disabled={isFetchingEligible}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingEligible ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handlePaySelected} 
              disabled={selectedEligibleIds.size === 0 || isProcessingPayroll || userRole === "SuperAdmin" || userRole === "PlatformAdmin"}
            >
              {isProcessingPayroll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Pay Selected ({selectedEligibleIds.size})
            </Button>
            <Button 
              onClick={handlePayAll} 
              disabled={eligibleEmployees.length === 0 || isProcessingPayroll || userRole === "SuperAdmin" || userRole === "PlatformAdmin"}
            >
              {isProcessingPayroll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Pay All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard label="Eligible Employees" value={eligibleEmployees.length} icon={Users} />
          <MetricCard label="Selected" value={selectedEligibleIds.size} icon={CheckCircle} />
          <MetricCard label="Recent Batches" value={payrollBatches.length} icon={Wallet} />
        </div>
      </Panel>

      {userRole !== "SuperAdmin" && userRole !== "PlatformAdmin" && (
        <Panel title="Eligible Employees List" className="mt-6">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search eligible employees..."
            className="pl-10"
            value={eligibleSearch}
            onChange={(e) => setEligibleSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedEligibleIds.size === filteredEligible.length && filteredEligible.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEligibleIds(new Set(filteredEligible.map(emp => (emp.user_id || emp.id) as number)));
                      } else {
                        setSelectedEligibleIds(new Set());
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Branch</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Account</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Net Payout</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEligible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    {isFetchingEligible ? "Loading..." : "No eligible employees found"}
                  </td>
                </tr>
              ) : (
                filteredEligible.map((emp) => (
                  <tr key={emp.user_id || emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedEligibleIds.has(emp.user_id || emp.id)}
                        disabled={emp.status === "Paid"}
                        onChange={(e) => {
                          const newSet = new Set(selectedEligibleIds);
                          if (e.target.checked) newSet.add(emp.user_id || emp.id);
                          else newSet.delete(emp.user_id || emp.id);
                          setSelectedEligibleIds(newSet);
                        }}
                        className={`rounded border-gray-300 ${emp.status === "Paid" ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{(emp.fullName || emp.name || "-") as string}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{(emp.category || "-") as string}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{(emp.branch || "-") as string}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{(emp.paymentNumber || "-") as string}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-emerald-600">
                      {Number(emp.netSalary || emp.net_salary || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        emp.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      )}

      {(userRole === "SuperAdmin" || userRole === "PlatformAdmin") && (
        <Panel title="Recent Payroll Batches" className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Batch Code</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Period</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Employees</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Total Net</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payrollBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">No batches found</td>
                  </tr>
                ) : (
                  payrollBatches.map((batch) => (
                    <tr key={batch.batch_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{batch.batch_code}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(batch.pay_period_start).toLocaleDateString()} - {new Date(batch.pay_period_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">{batch.total_employees}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-indigo-600">
                        {Number(batch.total_net_payable).toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          batch.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                          batch.status === "Approved" ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <PaymentActionMenu
                          batchId={batch.batch_id}
                          status={batch.status}
                          onView={() => {
                            setSelectedBatchForDetails(batch);
                            setIsDetailsModalOpen(true);
                          }}
                          onApprove={() => handleBatchAction(batch.batch_id, 'approve')}
                          onDeny={() => handleBatchAction(batch.batch_id, 'cancel')}
                          onMarkPaid={() => handleBatchAction(batch.batch_id, 'pay')}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Bank Distribution Modal */}
      {isDistModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Bank Distribution</h2>
              </div>
              <button onClick={() => setIsDistModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">Total Amount to Distribute</div>
                <div className="text-2xl font-bold text-gray-900">{totalPayout.toLocaleString()} RWF</div>
                <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Calculated for {processingType === "all" ? eligibleEmployees.length : selectedEligibleIds.size} employees
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Distributing Bank *</Label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={distForm.bankName}
                    onChange={(e) => setDistForm({ ...distForm, bankName: e.target.value })}
                  >
                    <option value="">Select a Bank</option>
                    {[
                      "Bank of Kigali (BK)", "I&M Bank", "Equity Bank", "KCB Bank", 
                      "BPR (Banque Populaire du Rwanda)", "Ecobank", "Zigama CSS", 
                      "Cogebanque", "Access Bank", "GTBank", "NCBA Bank"
                    ].map(bank => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Company Account Number *</Label>
                  <Input
                    placeholder="Enter account number"
                    value={distForm.accountNumber}
                    onChange={(e) => setDistForm({ ...distForm, accountNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    if (!distForm.bankName || !distForm.accountNumber) {
                      showNotification("error", "Please fill all required fields");
                      return;
                    }
                    setIsDistModalOpen(false);
                    setIsPinModalOpen(true);
                  }}
                >
                  Confirm & Continue
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setIsDistModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Final Security Check</h2>
              <p className="text-sm text-gray-500 mb-6">
                Please enter your administrator PIN or password to authorize this distribution of 
                <span className="font-semibold text-gray-900"> {totalPayout.toLocaleString()} RWF</span>
              </p>

              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter PIN / Password"
                  className="text-center text-lg tracking-widest h-12"
                  value={userPin}
                  onChange={(e) => setUserPin(e.target.value)}
                  autoFocus
                />
                
                <Button 
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={!userPin || isProcessingPayroll}
                  onClick={finalizePayroll}
                >
                  {isProcessingPayroll ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  Finish & Distribute
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => {
                    setIsPinModalOpen(false);
                    setIsDistModalOpen(true);
                  }}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Details Modal */}
      <BatchDetailsModal
        batch={selectedBatchForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedBatchForDetails(null);
        }}
      />
    </DashboardLayout>
  );
}
