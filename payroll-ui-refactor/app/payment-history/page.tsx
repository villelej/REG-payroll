"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  History,
  Scissors,
  MapPin,
  List,
  Download,
  Filter,
  RotateCcw,
  CreditCard,
  Settings,
  UserPlus,
} from "lucide-react";
import { DashboardLayout, SidebarMenuItem, Panel, StatusBadge, SectionHeader, MetricCard } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getLoggedUser } from "@/lib/auth";
import { apiFetchAuth } from "@/lib/api";

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

const adminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Employee Management", href: "/employee-management", icon: UserPlus },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Payment History", href: "/payment-history", icon: History },
];

const userMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/user-dashboard", icon: LayoutDashboard },
  { label: "Payment History", href: "/payment-history", icon: History },
];

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const [employeeFilter, setEmployeeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string>("");
  const [subtitleText, setSubtitleText] = useState("Employee Portal");
  const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>(userMenuItems);

  const handleApiError = useCallback((err: unknown, context: string) => {
    console.error(`Error ${context}:`, err);
    if (err instanceof Error) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.statusCode === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("loggedUser");
          router.replace("/");
          return;
        }
      } catch {
        if (err.message.includes("401") || err.message.toLowerCase().includes("unauthorized")) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("loggedUser");
          router.replace("/");
        }
      }
    }
  }, [router]);

  const loadData = useCallback(async (role: string, userId?: number, branchId?: number) => {
    setIsLoading(true);
    try {
      const normalizedRole = role.replace(/\s+/g, "").toLowerCase();
      const isAdmin = ["superadmin", "platformadmin", "admin", "companyadmin", "branchhr", "hr"].includes(normalizedRole);
      const isEmployee = !isAdmin;
      const endpoint = isEmployee ? "/payroll/my-payslips" : "/payroll/payslips";
      
      const [payslips, fetchedBranches, fetchedEmployees] = await Promise.all([
        apiFetchAuth<any[]>(endpoint),
        isAdmin ? apiFetchAuth<any[]>("/branches") : Promise.resolve([]),
        isAdmin ? apiFetchAuth<any[]>("/employees") : Promise.resolve([]),
      ]);

      if (payslips) {
        // Apply isolation logic
        if (normalizedRole === "branchhr" && branchId) {
          // BranchHR only sees their branch
          setPayments(payslips.filter(p => p.employees?.branch_id === branchId));
        } else {
          setPayments(payslips);
        }
      }
      if (fetchedBranches) setBranches(fetchedBranches);
      if (fetchedEmployees) setEmployees(fetchedEmployees);
    } catch (error) {
      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.message === "User is not associated with an employee profile") {
            return;
          }
        } catch {}
      }
      handleApiError(error, "load data");
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    const user = getLoggedUser() as Record<string, any> | null;
    if (user) {
      setUserName(user.fullName || user.username || user.email || "User");
      const rawRole = user.role || "Employee";
      const normalizedRole = rawRole.replace(/\s+/g, "").toLowerCase();
      setUserRole(rawRole);
      
      if (["superadmin", "platformadmin"].includes(normalizedRole)) {
        setSubtitleText("Super Admin Portal");
        setMenuItems(superAdminMenuItems);
      } else if (["admin", "companyadmin", "branchhr", "hr"].includes(normalizedRole)) {
        setSubtitleText("Admin Portal");
        setMenuItems(adminMenuItems);
      } else {
        setSubtitleText("Employee Portal");
        setMenuItems(userMenuItems);
      }
      loadData(rawRole, user.id || user.userId, user.branchId);
    } else {
      router.replace("/");
    }
  }, [router, loadData]);

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // For employees, we've already filtered the source 'payments' list in loadData
      if (employeeFilter && item.employee_id !== Number(employeeFilter)) return false;
      if (branchFilter && item.employees?.branch_id !== Number(branchFilter)) return false;
      if (statusFilter && item.payment_status !== statusFilter) return false;
      
      const pMonth = item.payroll_batches?.pay_period_start ? new Date(item.payroll_batches.pay_period_start).getMonth() + 1 : null;
      const pYear = item.payroll_batches?.pay_period_start ? new Date(item.payroll_batches.pay_period_start).getFullYear() : null;

      if (monthFilter && pMonth !== Number(monthFilter)) return false;
      if (yearFilter && pYear !== Number(yearFilter)) return false;
      return true;
    });
  }, [payments, employeeFilter, branchFilter, statusFilter, monthFilter, yearFilter]);

  const totalNet = filteredPayments.reduce((sum, p) => sum + Number(p.net_payable || 0), 0);
  const totalGross = filteredPayments.reduce((sum, p) => sum + Number(p.total_earnings || 0), 0);
  const totalDeducted = filteredPayments.reduce((sum, p) => sum + Number(p.total_deductions || 0), 0);

  const resetFilters = () => {
    setEmployeeFilter("");
    setBranchFilter("");
    setStatusFilter("");
    setMonthFilter("");
    setYearFilter("");
  };

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: subtitleText, menuItems: menuItems }}
      pageTitle="Payment History"
      userName={userName}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Records" value={filteredPayments.length} />
          <MetricCard label="Total Gross" value={`${totalGross.toLocaleString()} RWF`} />
          <MetricCard label="Total Deductions" value={`${totalDeducted.toLocaleString()} RWF`} />
          <MetricCard label="Total Net Paid" value={`${totalNet.toLocaleString()} RWF`} />
        </div>

        {/* Filters Panel */}
        <Panel title="Filters" action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {userRole !== "Employee" && (
              <>
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <select
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">All Employees</option>
                    {employees.map((e) => (
                      <option key={e.employee_id} value={e.employee_id}>
                        {e.first_name} {e.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
              >
                <option value="">All Status</option>
                <option value="Paid">PAID</option>
                <option value="Pending">PENDING</option>
                <option value="Cancelled">CANCELLED</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                placeholder="1-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                placeholder="2026"
              />
            </div>
          </div>
        </Panel>

        {/* Payment Records Table */}
        <Panel title="Payment Records" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Period</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Gross</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Deducted</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Paid</th>
                   <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pay Date</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      Loading payment records...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No payment records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((item) => (
                    <tr key={item.payslip_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {item.employees?.first_name} {item.employees?.last_name}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {branches.find(b => b.branch_id === item.employees?.branch_id)?.branch_name || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {item.payroll_batches?.remarks || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900 text-right font-medium">
                        {Number(item.total_earnings || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-red-600 text-right">
                        -{Number(item.total_deductions || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-emerald-600 text-right font-semibold">
                        {Number(item.net_payable || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={item.payment_status} />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-indigo-600 hover:text-indigo-700"
                          onClick={() => setSelectedPayslip(item)}
                        >
                          <List className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Salary Payslip</h2>
                <p className="text-indigo-100 text-sm">Period: {selectedPayslip.payroll_batches?.remarks || "N/A"}</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <RotateCcw className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-8 border-b border-gray-100 pb-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Employee</p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedPayslip.employees?.first_name} {selectedPayslip.employees?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">ID: {selectedPayslip.employees?.employee_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Payslip Number</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPayslip.payslip_number}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(selectedPayslip.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Earnings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">EARNINGS (By Category)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">{Number(selectedPayslip.basic_salary || 0).toLocaleString()} RWF</span>
                    </div>
                    {Number(selectedPayslip.hra || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">HRA (Category)</span>
                        <span className="font-medium">{Number(selectedPayslip.hra).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.conveyance || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Conveyance Allowance</span>
                        <span className="font-medium">{Number(selectedPayslip.conveyance).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.medical_allowance || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Medical Allowance</span>
                        <span className="font-medium">{Number(selectedPayslip.medical_allowance).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.special_allowance || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Special Allowance</span>
                        <span className="font-medium">{Number(selectedPayslip.special_allowance).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.bonus || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bonus</span>
                        <span className="font-medium">{Number(selectedPayslip.bonus).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.other_earnings || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Other Allowances</span>
                        <span className="font-medium">{Number(selectedPayslip.other_earnings).toLocaleString()} RWF</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-indigo-600 pt-2 border-t border-gray-50">
                      <span>Total Earnings</span>
                      <span>{Number(selectedPayslip.total_earnings).toLocaleString()} RWF</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">DEDUCTIONS (By Category)</h3>
                  <div className="space-y-3">
                    {Number(selectedPayslip.pf_employee || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">PF (Employee)</span>
                        <span className="font-medium">-{Number(selectedPayslip.pf_employee).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.professional_tax || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Professional Tax</span>
                        <span className="font-medium">-{Number(selectedPayslip.professional_tax).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.advance_recovery || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Advance Recovery</span>
                        <span className="font-medium">-{Number(selectedPayslip.advance_recovery).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.other_deductions || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Other Deductions</span>
                        <span className="font-medium">-{Number(selectedPayslip.other_deductions).toLocaleString()} RWF</span>
                      </div>
                    )}
                    {Number(selectedPayslip.total_deductions || 0) === 0 && (
                      <div className="flex justify-between text-sm text-gray-500 italic">
                        <span>No deductions for this period</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-red-600 pt-2 border-t border-gray-50">
                      <span>Total Deductions</span>
                      <span>-{Number(selectedPayslip.total_deductions).toLocaleString()} RWF</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Footer */}
              <div className="bg-gray-50 p-6 rounded-xl flex items-center justify-between border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Net Salary Payable</p>
                  <p className="text-sm text-gray-500 mt-1 italic">{selectedPayslip.net_pay_words}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-emerald-600">{Number(selectedPayslip.net_payable).toLocaleString()} RWF</p>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Successfully Paid</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => window.print()}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button className="bg-gray-900 hover:bg-gray-800" onClick={() => setSelectedPayslip(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
