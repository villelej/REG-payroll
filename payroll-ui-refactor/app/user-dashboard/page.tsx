"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  History,
  CreditCard,
  Download,
  X,
  AlertTriangle,
  Briefcase,
} from "lucide-react";
import { DashboardLayout, SidebarMenuItem, MetricCard, Panel, DataTable, StatusBadge } from "@/components/dashboard";
import { NotificationBanner } from "@/components/notification-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoggedUser, isRoleAllowedForRoute } from "@/lib/auth";
import { apiFetchAuth } from "@/lib/api";
import { Payment } from "@/lib/types";

const userMenuItems: SidebarMenuItem[] = [
  { label: "Dashboard", href: "/user-dashboard", icon: LayoutDashboard },
  { label: "Payment History", href: "/payment-history", icon: CreditCard },
];

type Section = "overview" | "profile" | "payments" | "category";

export default function UserDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [profileStatus, setProfileStatus] = useState("ACTIVE");
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState("");
  const [activityData, setActivityData] = useState<any[]>([]);
  const [salaryBreakdownData, setSalaryBreakdownData] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    national_id: "",
    phone_number: "",
    education_level: "",
    payment_number: "",
    contract_start: "",
    contract_end: "",
    branch: "",
    category: "",
    contract_type: "",
    date_of_birth: ""
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

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

  useEffect(() => {
    const loggedUser = getLoggedUser();
    const role = loggedUser?.role || "";
    if (!isRoleAllowedForRoute(role, "/user-dashboard")) {
      router.replace("/");
    }
    if (loggedUser && (loggedUser as Record<string, unknown>).fullName) {
      setUserName((loggedUser as Record<string, unknown>).fullName as string);
    }
  }, [router]);

  const loadProfile = async () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("loggedUser");
    if (!raw) return;
    try {
      const logged = JSON.parse(raw) as { id: number };
      const user = await apiFetchAuth<Record<string, unknown>>(`/users/${logged.id}`);
      setUserData(user);
      if (user.is_locked) setProfileStatus("LOCKED");
      else if (!user.is_active) setProfileStatus("BLOCKED");
      else setProfileStatus("ACTIVE");

      const profile = (user.profile || {}) as Record<string, unknown>;
      const formatDate = (dateStr: unknown) => dateStr ? new Date(dateStr as string).toISOString().split("T")[0] : "";

      setEditForm({
        full_name: (user.full_name || "") as string,
        national_id: (user.national_id || profile.national_id || "") as string,
        phone_number: (user.phone_number || profile.phone_number || "") as string,
        education_level: (user.education_level || profile.education_level || "") as string,
        payment_number: (user.payment_number || profile.payment_number || "") as string,
        contract_start: formatDate(user.contract_start || profile.contract_start),
        contract_end: formatDate(user.contract_end || profile.contract_end),
        branch: (user.branch || profile.branch || "") as string,
        category: (user.category || profile.category || "") as string,
        contract_type: (user.contract_type || profile.contract_type || "") as string,
        date_of_birth: formatDate(user.date_of_birth || profile.date_of_birth)
      });
    } catch (err) {
      handleApiError(err, "load profile");
      showNotification("error", "Failed to load profile.");
    }
  };

  const loadPayments = async () => {
    const user = getLoggedUser();
    const role = (user?.role || "").replace(/\s+/g, "").toLowerCase();
    const isAdmin = ["superadmin", "platformadmin", "admin", "companyadmin", "branchhr", "hr"].includes(role);
    
    // Only fetch personal payslips for non-admin users
    if (isAdmin) {
      return;
    }

    try {
      const data = await apiFetchAuth<any[]>("/payroll/my-payslips");
      if (data) {
        setPayments(data.map(p => ({
          id: p.payslip_id,
          month: p.payroll_batches?.month || (p.payroll_batches?.pay_period_start ? new Date(p.payroll_batches.pay_period_start).getMonth() + 1 : 1),
          year: p.payroll_batches?.year || (p.payroll_batches?.pay_period_start ? new Date(p.payroll_batches.pay_period_start).getFullYear() : 2024),
          days: p.worked_days || 30,
          grossAmount: Number(p.total_earnings || 0),
          deductedAmount: Number(p.total_deductions || 0),
          paidNetAmount: Number(p.net_payable || 0),
          status: p.payment_status || "Paid"
        })));
      }
    } catch (err) {
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.message === "User is not associated with an employee profile") {
            // Silently ignore for non-employee users
            return;
          }
        } catch {}
      }
      handleApiError(err, "load payments");
    }
  };

  const loadCharts = async () => {
    try {
      const chartData = await apiFetchAuth<any[]>("/employees/me/salary-chart");
      if (chartData) {
        setActivityData(chartData.map(d => ({
          month: d.month,
          amount: Number(d.amount || 0)
        })));
      }

      const breakdownData = await apiFetchAuth<any[]>("/employees/me/salary-breakdown");
      if (breakdownData) {
        setSalaryBreakdownData(breakdownData.map((d, i) => ({
          name: d.name,
          value: Number(d.value || 0),
          color: ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"][i % 4]
        })));
      }
    } catch (err) {
      console.error("Failed to load charts:", err);
    }
  };

  const loadCategoryDetails = async () => {
    try {
      const details = await apiFetchAuth<any>("/employees/me/category-details");
      setCategoryDetails(details);
    } catch (err) {
      console.error("Failed to load category details:", err);
    }
  };

  useEffect(() => {
    loadProfile();
    loadPayments();
    loadCharts();
    loadCategoryDetails();
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.id]: e.target.value });
  };

  const submitEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    try {
      const payload = {
        full_name: editForm.full_name,
        phone_number: editForm.phone_number,
        payment_number: editForm.payment_number
      };
      await apiFetchAuth(`/employees/me/profile`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      showNotification("success", "Your profile update request has been submitted for approval.");
      setIsEditing(false);
      loadProfile();
    } catch (err: unknown) {
      let errorMsg = "Failed to update profile.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.message) {
            errorMsg = Array.isArray(parsed.message) ? parsed.message.join("\n") : parsed.message;
          }
        } catch {
          errorMsg = err.message;
        }
      }
      showNotification("error", errorMsg);
    }
  };

  const totalNetPaid = payments.reduce((sum, p) => sum + (p.paidNetAmount || 0), 0);
  const latestPayment = payments.length ? payments[payments.length - 1] : null;
  const latestMonth = latestPayment ? `${latestPayment.month}/${latestPayment.year}` : "-";

  const overviewCards = [
    { label: "Profile Status", value: profileStatus },
    { label: "Total Payments", value: payments.length },
    { label: "Net Paid Total", value: totalNetPaid.toLocaleString() },
    { label: "Latest Payment", value: latestMonth },
  ];

  const profile = (userData?.profile || {}) as Record<string, unknown>;
  const profileItems = [
    { label: "Full Name", value: (userData?.full_name || "-") as string },
    { label: "National ID", value: (userData?.national_id || profile.national_id || "-") as string },
    { label: "Phone", value: (userData?.phone_number || profile.phone_number || "-") as string },
    { label: "Start Date", value: userData?.contract_start ? new Date(userData.contract_start as string).toLocaleDateString() : profile.contract_start ? new Date(profile.contract_start as string).toLocaleDateString() : "-" },
    { label: "End Date", value: userData?.contract_end ? new Date(userData.contract_end as string).toLocaleDateString() : profile.contract_end ? new Date(profile.contract_end as string).toLocaleDateString() : "-" },
    { label: "Branch", value: (userData?.branch || profile.branch || "-") as string },
    { label: "Category", value: (userData?.category || profile.category || "-") as string },
    { label: "Contract Type", value: (userData?.contract_type || profile.contract_type || "-") as string },
    { label: "Education Level", value: (userData?.education_level || profile.education_level || "-") as string },
    { label: "Date of Birth", value: userData?.date_of_birth ? new Date(userData.date_of_birth as string).toLocaleDateString() : profile.date_of_birth ? new Date(profile.date_of_birth as string).toLocaleDateString() : "-" },
    { label: "Account No", value: (userData?.payment_number || profile.payment_number || "-") as string },
  ];

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Employee Portal", menuItems: userMenuItems }}
      pageTitle="User Dashboard"
      userName={userName}
    >
      {notification && (
        <NotificationBanner
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Section Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        {[
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "profile", label: "My Profile", icon: User },
          { id: "category", label: "My Category", icon: Briefcase },
          { id: "payments", label: "Payment History", icon: History },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as Section)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW SECTION */}
      {activeSection === "overview" && (
        <div className="space-y-6">
          {/* Category Badge - Prominently Displayed */}
          {userData?.category && (
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveSection("category")}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium uppercase tracking-wide">Your Salary Category</p>
                  <h2 className="text-3xl font-bold text-white mt-2">{userData.category}</h2>
                  <p className="text-indigo-100 text-sm mt-3">Click to view your allowances and deductions</p>
                </div>
                <Briefcase className="w-16 h-16 text-indigo-300 opacity-75" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewCards.map((card) => (
              <MetricCard key={card.label} label={card.label} value={card.value} />
            ))}
          </div>

          <Panel title="Quick Note">
            <p className="text-gray-600">
              This portal provides read access to your personal details and salary payment history.
              Contact your administrator for account or employee record changes.
            </p>
          </Panel>

          <Panel title="Quick Links">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => setActiveSection("profile")}>
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
              <Button variant="outline" onClick={() => setActiveSection("category")}>
                <Briefcase className="w-4 h-4 mr-2" />
                View Category
              </Button>
              <Button variant="outline" onClick={() => setActiveSection("payments")}>
                <History className="w-4 h-4 mr-2" />
                Payment History
              </Button>
              <Button variant="outline" asChild>
                <Link href="/payment-history">
                  <CreditCard className="w-4 h-4 mr-2" />
                  All Payment Records
                </Link>
              </Button>
            </div>
          </Panel>
        </div>
      )}

      {/* PROFILE SECTION */}
      {activeSection === "profile" && (
        <div className="space-y-6">
          {/* Category Badge */}
          {userData?.category && (
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-indigo-600">Assigned Category</p>
                <p className="text-lg font-bold text-indigo-900">{userData.category}</p>
              </div>
              <button 
                onClick={() => setActiveSection("category")}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                View Details
              </button>
            </div>
          )}

          <Panel
            title="My Profile"
            action={
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">{item.label}</p>
                  <p className="text-base text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* CATEGORY SECTION */}
      {activeSection === "category" && (
        <div className="space-y-6">
          {categoryDetails ? (
            <>
              {/* Category Header */}
              <Panel>
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{categoryDetails.categoryName}</h3>
                    <p className="text-sm text-gray-600 mt-1">Code: {categoryDetails.categoryCode}</p>
                  </div>
                  <Briefcase className="w-12 h-12 text-indigo-600" />
                </div>

                {categoryDetails.message ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">{categoryDetails.message}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {/* Allowances */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                        Allowances & Earnings
                      </h4>
                      <div className="space-y-3">
                        {categoryDetails.allowances && categoryDetails.allowances.length > 0 ? (
                          <>
                            {categoryDetails.allowances.map((allowance: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-start p-3 bg-emerald-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{allowance.name}</p>
                                  <p className="text-xs text-gray-600">{allowance.type}</p>
                                </div>
                                <p className="font-semibold text-emerald-600">{Number(allowance.amount).toLocaleString()} RWF</p>
                              </div>
                            ))}
                            {categoryDetails.totalAllowances > 0 && (
                              <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg border border-emerald-300 mt-4">
                                <p className="font-bold text-gray-900">Total Allowances</p>
                                <p className="font-bold text-emerald-700">{Number(categoryDetails.totalAllowances).toLocaleString()} RWF</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 italic text-center py-8">No allowances configured for this category</p>
                        )}
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Deductions
                      </h4>
                      <div className="space-y-3">
                        {categoryDetails.deductions && categoryDetails.deductions.length > 0 ? (
                          <>
                            {categoryDetails.deductions.map((deduction: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-start p-3 bg-red-50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{deduction.name}</p>
                                  <p className="text-xs text-gray-600">{deduction.description}</p>
                                </div>
                                <p className="font-semibold text-red-600">{Number(deduction.percentage).toFixed(2)}%</p>
                              </div>
                            ))}
                            {categoryDetails.deductionPercentages > 0 && (
                              <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border border-red-300 mt-4">
                                <p className="font-bold text-gray-900">Total Deduction Rate</p>
                                <p className="font-bold text-red-700">{Number(categoryDetails.deductionPercentages).toFixed(2)}%</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 italic text-center py-8">No deductions configured for this category</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>

              {/* Info Box */}
              <Panel title="How This Works" noPadding>
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    Your salary is calculated based on your assigned category. The <strong>allowances</strong> shown above are added to your basic salary, 
                    while <strong>deductions</strong> are applied as percentages of your gross salary. This information helps you understand your payslip breakdown.
                  </p>
                </div>
              </Panel>
            </>
          ) : (
            <Panel>
              <div className="text-center py-12">
                <p className="text-gray-600">Loading category details...</p>
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* PAYMENTS SECTION */}
      {activeSection === "payments" && (
        <div className="space-y-6">
          <Panel title="Payment History" action={
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Payslips
            </Button>
          }>
            <DataTable
              columns={[
                { key: "month", label: "Month" },
                { key: "year", label: "Year" },
                { key: "days", label: "Days" },
                { key: "grossAmount", label: "Gross", render: (p: Payment) => p.grossAmount?.toLocaleString() || "-" },
                { key: "deductedAmount", label: "Deducted", render: (p: Payment) => p.deductedAmount?.toLocaleString() || "-" },
                { key: "paidNetAmount", label: "Net Paid", render: (p: Payment) => p.paidNetAmount?.toLocaleString() || "-" },
                { key: "status", label: "Status", render: (p: Payment) => <StatusBadge status={p.status} /> },
              ]}
              data={payments}
              keyExtractor={(p) => p.id}
              emptyMessage="No payment records found"
            />
          </Panel>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={submitEditProfile} className="p-6">
              {/* Warning Banner */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Restricted Editing</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You may only edit your Name, Phone, and Account Number. To modify other details, please contact your Admin or HR.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={editForm.phone_number}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="payment_number">Account Number</Label>
                  <Input
                    id="payment_number"
                    value={editForm.payment_number}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="sm:col-span-2 pt-4 border-t border-gray-100 mt-4">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Read-only Details</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input id="national_id" value={editForm.national_id} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education_level">Education Level</Label>
                  <Input id="education_level" value={editForm.education_level} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_start">Start Date</Label>
                  <Input id="contract_start" type="date" value={editForm.contract_start} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_end">End Date</Label>
                  <Input id="contract_end" type="date" value={editForm.contract_end} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input id="branch" value={editForm.branch} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={editForm.category} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
