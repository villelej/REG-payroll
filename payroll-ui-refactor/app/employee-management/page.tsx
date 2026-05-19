"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit,
  CheckCircle,
  Ban,
  X,
  LayoutDashboard,
  CreditCard,
  Settings,
  History,
} from "lucide-react";
import {
  DashboardLayout,
  SidebarMenuItem,
  DataTable,
  StatusBadge,
  SectionHeader,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoggedUser, isRoleAllowedForRoute } from "@/lib/auth";
import { apiFetchAuth } from "@/lib/api";

const RWANDAN_BANKS = [
  "Bank of Kigali (BK)",
  "I&M Bank",
  "Cogebanque",
  "Equity Bank",
  "KCB Bank",
  "BPR (Banque Populaire du Rwanda)",
  "Ecobank",
  "Access Bank",
  "GTBank",
  "NCBA Bank",
  "Urwego Bank",
  "Zigama CSS",
];

const MOMO_PROVIDERS = [
  "MTN Mobile Money",
  "Airtel Money",
];

const adminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Employee Management", href: "/employee-management", icon: UserPlus },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Payment History", href: "/payment-history", icon: History },
];

interface User {
  id: number;
  name: string;
  username: string;
  national_id: string;
  email: string;
  phone_number: string;
  branch: string;
  category: string;
  contract_type: string;
  contract_start: string;
  contract_end: string;
  education_level: string;
  payment_method: string;
  payment_number: string;
  status: string;
  status_request?: string;
}

const NotificationBanner = ({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) => (
  <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 flex items-center justify-between gap-4 animate-in slide-in-from-right ${type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"}`}>
    <p className="text-sm font-medium">{message}</p>
    <button onClick={onClose} className="hover:opacity-70 transition-opacity"><X className="w-4 h-4" /></button>
  </div>
);

export default function EmployeeManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string; status: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; status: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userBranchId, setUserBranchId] = useState<number | null>(null);
  const [userBranchName, setUserBranchName] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [userForm, setUserForm] = useState({
    national_id: "", name: "", username: "", email: "", phone_number: "", password: "Reg@12345",
    branch: "", payment_method: "", payment_number: "",
    category: "", contract_type: "", contract_start: "", contract_end: "", education_level: ""
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApiError = useCallback((err: unknown, context: string) => {
    let errorMsg = `An error occurred while ${context}.`;
    if (err instanceof Error) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.message) errorMsg = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
      } catch { errorMsg = err.message; }
    }
    showNotification("error", errorMsg);
  }, []);

  const loadSystemData = useCallback(async () => {
    try {
      const [fetchedBranches, fetchedCategories] = await Promise.all([
        apiFetchAuth<Record<string, unknown>[]>("/branches"),
        apiFetchAuth<Record<string, unknown>[]>("/categories")
      ]);
      if (fetchedBranches) setBranches(fetchedBranches.map(b => ({
        id: b.branch_id as number, name: b.branch_name as string, status: b.status as string
      })));
      if (fetchedCategories) setCategories(fetchedCategories.map(c => ({
        id: c.category_id as number, name: c.category_name as string, status: c.status as string
      })));
    } catch (err) { handleApiError(err, "loading system data"); }
  }, [handleApiError]);

  const loadUsers = useCallback(async (q = "") => {
    try {
      setIsLoading(true);
      const authUsers = await apiFetchAuth<Record<string, unknown>[]>(`/users?role=Employee&q=${encodeURIComponent(q)}`);
      
      if (authUsers) {
        setUsers(authUsers.map((u: any) => {
          const profile = (u.profile || {}) as Record<string, any>;
          return {
            id: u.user_id as number,
            name: (u.full_name || u.username || "") as string,
            username: (u.username || "") as string,
            national_id: (u.national_id || profile.national_id || "") as string,
            email: (u.email || "") as string,
            phone_number: (u.phone_number || profile.phone_number || "") as string,
            branch: (u.branch || profile.branch || "") as string,
            payment_method: (u.payment_method || profile.payment_method || "") as string,
            payment_number: (u.payment_number || profile.payment_number || "") as string,
            category: (u.category || profile.category || "") as string,
            category_id: u.category_id,
            contract_type: (u.contract_type || profile.contract_type || "") as string,
            contract_start: (u.contract_start || profile.contract_start || "") as string,
            contract_end: (u.contract_end || profile.contract_end || "") as string,
            education_level: (u.education_level || profile.education_level || "") as string,
            status: (u.account_status || profile.status || (u.is_active ? "ACTIVE" : "BLOCKED")) as string,
            status_request: profile.status_request as string,
          };
        }));
      }
    } catch (err) { 
      handleApiError(err, "loading employees"); 
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    const user = getLoggedUser();
    if (!user || !isRoleAllowedForRoute(user.role || "", "/admin-dashboard")) {
      router.replace("/");
      return;
    }
    setUserName(user.fullName || user.username || user.email || "Admin");
    setUserRole(user.role || "");
    setUserBranchId(user.branchId || null);
    setUserBranchName(user.branch || "");
    loadUsers();
    loadSystemData();
  }, [router, loadUsers, loadSystemData]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const resetUserForm = () => {
    const initialBranch = userRole === "branchhr" ? userBranchName : "";
    setUserForm({
      national_id: "", name: "", username: "", email: "", phone_number: "", password: "Reg@12345",
      branch: initialBranch, payment_method: "", payment_number: "",
      category: "", contract_type: "", contract_start: "", contract_end: "", education_level: ""
    });
    setIsEditingUser(false);
    setEditId(null);
    setIsModalOpen(false);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        national_id: userForm.national_id,
        full_name: userForm.name,
        email: userForm.email,
        phone_number: userForm.phone_number,
        role: "Employee",
        status: "ACTIVE",
        branch: userForm.branch || null,
        category: userForm.category || null,
        contract_type: userForm.contract_type || null,
        education_level: userForm.education_level || null,
        username: userForm.username || null,
        payment_method: userForm.payment_method || null,
        payment_number: userForm.payment_number || null,
        contract_start: userForm.contract_start || null,
        contract_end: userForm.contract_end || null,
      };

      if (isEditingUser && editId) {
        await apiFetchAuth(`/users/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
        showNotification("success", "Employee updated successfully.");
      } else {
        await apiFetchAuth(`/users`, { method: "POST", body: JSON.stringify(payload) });
        showNotification("success", "Employee created successfully.");
      }
      resetUserForm();
      loadUsers(searchQuery);
    } catch (err) { handleApiError(err, "saving employee"); }
  };

  const requestStatusUpdate = async (userId: number, requestedStatus: string) => {
    if (!confirm(`Request to change status to ${requestedStatus}?`)) return;
    try {
      await apiFetchAuth(`/users/status`, {
        method: "PATCH",
        body: JSON.stringify({ userId, status: "PENDING", reason: `Request to ${requestedStatus}` })
      });
      showNotification("success", `Request sent. Awaiting SuperAdmin approval.`);
      loadUsers(searchQuery);
    } catch (err) { handleApiError(err, "requesting status update"); }
  };

  const paymentType = (userForm.payment_method === "MoMo" || MOMO_PROVIDERS.includes(userForm.payment_method)) ? "MoMo" : (userForm.payment_method === "Bank" || RWANDAN_BANKS.includes(userForm.payment_method)) ? "Bank" : "";

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Admin Portal", menuItems: adminMenuItems }}
      pageTitle="Employee Management"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <SectionHeader
        title="Employee Management"
        description="Manage all employee records and their details"
        action={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); loadUsers(e.target.value); }}
              />
            </div>
            <Button onClick={() => { resetUserForm(); setIsModalOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        }
      />

      {userRole === "branchhr" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Branch Access Restricted:</span> You can only view and manage employees assigned to your branch <span className="font-semibold">{userBranchName}</span>. Other branches are not visible.
          </p>
        </div>
      )}

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "national_id", label: "National ID" },
          { key: "branch", label: "Branch" },
          { key: "category", label: "Category", render: (u: User) => (
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{u.category || "N/A"}</span>
              {!u.category_id && u.category && (
                <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <X className="w-2.5 h-2.5" /> Missing Link
                </span>
              )}
            </div>
          )},
          { key: "status", label: "Status", render: (u: User) => (
            <div className="flex flex-col gap-1">
              <StatusBadge status={u.status} />
              {u.status_request && <StatusBadge status={`Pending: ${u.status_request}`} type="warning" />}
            </div>
          )},
          { key: "actions", label: "Actions", render: (u: User) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => { setUserForm(u as any); setIsEditingUser(true); setEditId(u.id); setIsModalOpen(true); }}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => requestStatusUpdate(u.id, "ACTIVE")} className="text-emerald-600 focus:text-emerald-600">
                  <CheckCircle className="w-4 h-4 mr-2" /> Request Activation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestStatusUpdate(u.id, "BLOCKED")} className="text-red-600 focus:text-red-600">
                  <Ban className="w-4 h-4 mr-2" /> Request Block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )},
        ]}
        data={users}
        keyExtractor={(u) => u.id}
        emptyMessage={isLoading ? "Loading employees..." : "No employees found"}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">{isEditingUser ? "Edit Employee" : "Register New Employee"}</h2>
              <button onClick={resetUserForm} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={saveUser} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="national_id">National ID *</Label><Input id="national_id" value={userForm.national_id} onChange={handleUserChange} required /></div>
                <div className="space-y-2"><Label htmlFor="name">Full Name *</Label><Input id="name" value={userForm.name} onChange={handleUserChange} required /></div>
                <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={userForm.email} onChange={handleUserChange} required /></div>
                <div className="space-y-2"><Label htmlFor="phone_number">Phone *</Label><Input id="phone_number" value={userForm.phone_number} onChange={handleUserChange} required /></div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch{userRole === "branchhr" && " *"}</Label>
                  <select 
                    id="branch" 
                    value={userForm.branch} 
                    onChange={handleUserChange} 
                    disabled={userRole === "branchhr"}
                    required={userRole === "branchhr"}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {userRole === "branchhr" ? (
                      <>
                        <option value="">{userBranchName || "Select Branch"}</option>
                      </>
                    ) : (
                      <>
                        <option value="">Select Branch</option>
                        {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2"><Label htmlFor="category">Category</Label><select id="category" value={userForm.category} onChange={handleUserChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium"><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <select 
                    id="payment_type" 
                    value={paymentType} 
                    onChange={(e) => setUserForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium"
                  >
                    <option value="">Select Type</option>
                    <option value="MoMo">Mobile Money (MoMo)</option>
                    <option value="Bank">Bank Transfer</option>
                  </select>
                </div>

                {paymentType === "MoMo" && (
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">MoMo Provider</Label>
                    <select id="payment_method" value={userForm.payment_method} onChange={handleUserChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium">
                      <option value="">Select Provider</option>
                      {MOMO_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                {paymentType === "Bank" && (
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Select Bank</Label>
                    <select id="payment_method" value={userForm.payment_method} onChange={handleUserChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium">
                      <option value="">Search/Select Bank</option>
                      {RWANDAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-2"><Label htmlFor="payment_number">Account/Phone Number</Label><Input id="payment_number" value={userForm.payment_number} onChange={handleUserChange} placeholder="Enter number..." /></div>
                
                <div className="space-y-2"><Label htmlFor="contract_type">Contract Type</Label><select id="contract_type" value={userForm.contract_type} onChange={handleUserChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium"><option value="">Select Type</option><option value="Permanent">Permanent</option><option value="Contract">Contract</option><option value="Temporary">Temporary</option></select></div>
                
                <div className="space-y-2">
                  <Label htmlFor="education_level">Education Level</Label>
                  <select id="education_level" value={userForm.education_level} onChange={handleUserChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium">
                    <option value="">Select Level</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor">Bachelor's Degree</option>
                    <option value="Master">Master's Degree</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>

                <div className="space-y-2"><Label htmlFor="contract_start">Contract Start Date</Label><Input id="contract_start" type="date" value={userForm.contract_start} onChange={handleUserChange} /></div>
                <div className="space-y-2"><Label htmlFor="contract_end">Contract End Date</Label><Input id="contract_end" type="date" value={userForm.contract_end} onChange={handleUserChange} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={resetUserForm}>Cancel</Button>
                <Button type="submit">{isEditingUser ? "Update Employee" : "Register Employee"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
