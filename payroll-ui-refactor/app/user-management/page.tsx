"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  LayoutDashboard,
  Users,
  Database,
  ShieldCheck,
  History,
  UserPlus,
  Scissors,
  MapPin,
  List,
  MoreVertical,
  Edit,
  Key,
  Trash2,
  CheckCircle,
  Lock,
  Ban,
  X,
  Search,
  Settings,
} from "lucide-react";
import { DashboardLayout, SidebarMenuItem, Panel, DataTable, StatusBadge, SectionHeader } from "@/components/dashboard";
import { NotificationBanner } from "@/components/notification-banner";
import { BranchAssignmentSection } from "@/components/user-management/branch-assignment";
import RoleBasedUserForm from "@/components/user-management/role-based-user-form";
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
import { apiFetchAuth } from "@/lib/api";
import { getLoggedUser } from "@/lib/auth";
import { User, Role, Branch, Category } from "@/lib/types";

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

const blankForm = {
  id: 0,
  name: "",
  username: "",
  national_id: "",
  date_of_birth: "",
  email: "",
  phone_number: "",
  branch: "",
  payment_method: "",
  payment_number: "",
  password: "Reg@12345",
  roleId: 0,
  status: "ACTIVE",
  category: "",
  contract_type: "",
  contract_start: "",
  contract_end: "",
  education_level: "",
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ ...blankForm });
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [canViewAllBranches, setCanViewAllBranches] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadUsers = useCallback(async (q = "") => {
    try {
      const authUsers = await apiFetchAuth<Record<string, unknown>[]>(`/users${q ? `?q=${q}` : ""}`);
      if (authUsers) {
        const mappedUsers = authUsers.map((u) => {
          const roleStr = String(u.role || "");
          const profile = (u.profile || {}) as Record<string, any>;
          return {
            id: u.user_id as number,
            name: (u.full_name || u.username || "") as string,
            username: (u.username || "") as string,
            national_id: (u.national_id || profile.national_id || "") as string,
            date_of_birth: (u.date_of_birth || profile.date_of_birth || "") as string,
            email: (u.email || "") as string,
            phone_number: (u.phone_number || profile.phone_number || "") as string,
            branch: (u.branch || profile.branch || "") as string,
            payment_method: (u.payment_method || profile.payment_method || "") as string,
            payment_number: (u.payment_number || profile.payment_number || "") as string,
            role: roleStr === "Employee" ? "User" : roleStr === "CompanyAdmin" ? "Admin" : roleStr,
            roleId: (roleStr === "SuperAdmin" || roleStr === "superadmin" || roleStr === "PlatformAdmin") ? 1 : 
                    (roleStr === "CompanyAdmin" || roleStr === "Admin" || roleStr === "admin" || roleStr === "BranchHR") ? 2 : 
                    (roleStr === "Employee" || roleStr === "User" || roleStr === "user" || roleStr === "users") ? 3 : 0,
            status: (u.is_locked ? "LOCKED" : !u.is_active ? "BLOCKED" : "ACTIVE") as string,
            category: (u.category || profile.category || "") as string,
            contract_type: (u.contract_type || profile.contract_type || "") as string,
            contract_start: (u.contract_start || profile.contract_start || "") as string,
            contract_end: (u.contract_end || profile.contract_end || "") as string,
            education_level: (u.education_level || profile.education_level || "") as string,
            status_request: profile.status_request as string | null,
          };
        });
        setUsers(mappedUsers);
      }
    } catch {}
  }, []);

  const loadSystemData = useCallback(async () => {
    try {
      const [fetchedRoles, fetchedBranches, fetchedCategories] = await Promise.all([
        apiFetchAuth<Record<string, unknown>[]>("/roles"),
        apiFetchAuth<Record<string, unknown>[]>("/branches"),
        apiFetchAuth<Record<string, unknown>[]>("/categories"),
      ]);

      if (fetchedRoles) {
        setRoles(fetchedRoles.map((r) => ({ id: r.role_id as number, name: r.role_name as string, status: r.status as string })));
      }
      if (fetchedBranches) {
        setBranches(fetchedBranches.map((b) => ({
          id: b.branch_id as number,
          name: b.branch_name as string,
          hubId: b.branch_code as string,
          province: b.province as string | undefined,
          district: b.district as string | undefined,
          status: b.status === "Approved" ? "ACTIVE" : (b.status as string),
        })));
      }
      if (fetchedCategories) {
        setCategories(fetchedCategories.map((c) => ({
          id: c.category_id as number,
          name: c.category_name as string,
          code: c.category_code as string,
          status: c.status as string,
        })));
      }
    } catch {}
  }, []);

  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadUsers();
    loadSystemData();
    const user = getLoggedUser();
    if (user) {
      setUserName(user.fullName || user.username || user.email || "Super Admin");
    }
  }, [loadUsers, loadSystemData]);

  const roleNameById = (roleId: number): string => roles.find((r) => r.id === roleId)?.name ?? "Unknown";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const keyMap: Record<string, string> = {
      userName: "name",
      userUsername: "username",
      userPassword: "password",
      userRole: "roleId",
      userStatus: "status",
    };
    const key = keyMap[id] ?? id;
    const newRoleId = key === "roleId" ? Number(value) : form.roleId;
    
    setForm((prev) => ({
      ...prev,
      [key]: key === "roleId" ? Number(value) : value,
    }));

    // Reset branch assignment when role changes from Admin
    if (key === "roleId" && Number(value) !== 2) {
      setSelectedBranches([]);
      setCanViewAllBranches(false);
    }
  };

  const resetForm = () => {
    setForm({ ...blankForm, roleId: 0 });
    setSelectedBranches([]);
    setCanViewAllBranches(false);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const editUser = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setForm({
      id: user.id,
      name: user.name,
      username: user.username || "",
      national_id: user.national_id || "",
      date_of_birth: user.date_of_birth || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      branch: user.branch || "",
      payment_method: user.payment_method || "",
      payment_number: user.payment_number || "",
      password: "",
      roleId: user.roleId,
      status: user.status,
      category: user.category || "",
      contract_type: user.contract_type || "",
      contract_start: user.contract_start ? new Date(user.contract_start).toISOString().split("T")[0] : "",
      contract_end: user.contract_end ? new Date(user.contract_end).toISOString().split("T")[0] : "",
      education_level: user.education_level || "",
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await apiFetchAuth(`/users/${userId}`, { method: "DELETE" });
      showNotification("success", "User deleted successfully.");
      loadUsers(searchQuery);
    } catch {
      showNotification("error", "Failed to delete user");
    }
  };

  const handleDirectStatusChange = async (userId: number, newStatus: string) => {
    try {
      await apiFetchAuth(`/users/status`, {
        method: "PATCH",
        body: JSON.stringify({ userId, status: newStatus, reason: `Direct status change to ${newStatus}` }),
      });
      showNotification("success", `Status changed to ${newStatus} successfully.`);
      loadUsers(searchQuery);
    } catch {
      showNotification("error", "Failed to change status.");
    }
  };

  const handleStatusApproval = async (userId: number, action: "APPROVE_PENDING" | "REJECT_PENDING") => {
    try {
      await apiFetchAuth(`/users/status`, {
        method: "PATCH",
        body: JSON.stringify({ userId, status: action, reason: action === "APPROVE_PENDING" ? "Approved by SuperAdmin" : "Rejected by SuperAdmin" }),
      });
      showNotification("success", `Status request ${action === "APPROVE_PENDING" ? "approved" : "rejected"} successfully.`);
      loadUsers(searchQuery);
    } catch {
      showNotification("error", "Failed to process status approval.");
    }
  };

  const resetUserPassword = async (userId: number) => {
    if (!confirm("Send password reset email to this user?")) return;
    try {
      await apiFetchAuth(`/users/${userId}/reset-password`, { method: "POST" });
      showNotification("success", "Password reset email sent.");
    } catch {
      showNotification("error", "Failed to reset password.");
    }
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!form.name.trim() || !form.email.trim() || !form.national_id.trim() || !form.phone_number.trim()) {
      showNotification("error", "Please fill all mandatory fields.");
      return;
    }

    if (form.roleId === 0) {
      showNotification("error", "Please select a Role.");
      return;
    }

    // Validate branch assignment for Admin users
    if (form.roleId === 2 && !canViewAllBranches && selectedBranches.length === 0) {
      showNotification("error", "For Admin users, please either select specific branches or enable 'View All Branches'.");
      return;
    }

    const generatedUsername = form.username || form.email.split("@")[0];

    // Determine branch value based on selection
    let branchValue = form.branch;
    if (form.roleId === 2) {
      if (canViewAllBranches) {
        branchValue = "*"; // Special value indicating all branches
      } else if (selectedBranches.length > 0) {
        // For multi-branch, we'll use the first branch in the simple field
        // The backend should be updated to handle accessible_branches field
        const selectedBranchObj = branches.find((b) => b.id === selectedBranches[0]);
        branchValue = selectedBranchObj?.name || "";
      }
    }

    const payload = {
      full_name: form.name,
      username: generatedUsername,
      email: form.email,
      national_id: form.national_id,
      phone_number: form.phone_number,
      branch: branchValue,
      date_of_birth: form.date_of_birth,
      payment_method: form.payment_method,
      payment_number: form.payment_number,
      category: form.category,
      contract_type: form.contract_type,
      contract_start: form.contract_start,
      contract_end: form.contract_end,
      education_level: form.education_level,
      status: form.status,
      role: form.roleId === 1 ? "SuperAdmin" : form.roleId === 2 ? "CompanyAdmin" : "Employee",
      ...(isEditing ? {} : { password: form.password || "Reg@12345" }),
      // Include branch assignment info for future multi-branch support
      ...(form.roleId === 2 ? {
        canViewAllBranches,
        selectedBranches: canViewAllBranches ? [] : selectedBranches,
      } : {}),
    };

    try {
      console.log("Submitting User Payload:", payload);
      if (isEditing && form.id) {
        await apiFetchAuth(`/users/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
        showNotification("success", "User details updated successfully.");
      } else {
        await apiFetchAuth(`/users`, { method: "POST", body: JSON.stringify(payload) });
        showNotification("success", "User created successfully.");
      }
      resetForm();
      loadUsers(searchQuery);
    } catch (err: any) {
      console.error("User Save Error:", err);
      let errorMsg = "An unexpected error occurred.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          errorMsg = Array.isArray(parsed.message) ? parsed.message.join(", ") : (parsed.message || err.message);
        } catch {
          errorMsg = err.message;
        }
      }
      showNotification("error", errorMsg);
    }
  };

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Super Admin Portal", menuItems: superAdminMenuItems }}
      pageTitle="User Management"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <SectionHeader
        title="System Users"
        description="Manage all users and their access permissions"
        action={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); loadUsers(e.target.value); }}
              />
            </div>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone_number", label: "Phone", render: (u: User) => u.phone_number || "-" },
          { key: "role", label: "Role", render: (u: User) => u.role || "-" },
          { key: "branch", label: "Branch", render: (u: User) => u.branch || "-" },
          { key: "status", label: "Status", render: (u: User) => (
            <div className="flex flex-col gap-1">
              <StatusBadge status={u.status} />
              {u.status_request && (
                <StatusBadge status={`Pending: ${u.status_request}`} type="warning" />
              )}
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
                <DropdownMenuItem onClick={() => editUser(u.id)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => resetUserPassword(u.id)}>
                  <Key className="w-4 h-4 mr-2" /> Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {u.status !== "ACTIVE" && (
                  <DropdownMenuItem onClick={() => handleDirectStatusChange(u.id, "ACTIVE")} className="text-emerald-600 focus:text-emerald-600">
                    <CheckCircle className="w-4 h-4 mr-2" /> Activate
                  </DropdownMenuItem>
                )}
                {u.status !== "LOCKED" && (
                  <DropdownMenuItem onClick={() => handleDirectStatusChange(u.id, "LOCKED")} className="text-amber-600 focus:text-amber-600">
                    <Lock className="w-4 h-4 mr-2" /> Lock
                  </DropdownMenuItem>
                )}
                {u.status !== "BLOCKED" && (
                  <DropdownMenuItem onClick={() => handleDirectStatusChange(u.id, "BLOCKED")} className="text-red-600 focus:text-red-600">
                    <Ban className="w-4 h-4 mr-2" /> Block
                  </DropdownMenuItem>
                )}
                {u.status_request && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusApproval(u.id, "APPROVE_PENDING")} className="text-emerald-600 focus:text-emerald-600 font-medium">
                      Approve Request
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusApproval(u.id, "REJECT_PENDING")} className="text-red-600 focus:text-red-600 font-medium">
                      Reject Request
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteUser(u.id)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )},
        ]}
        data={users}
        keyExtractor={(u) => u.id}
        emptyMessage="No users found"
      />

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit User" : "Create New User"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <RoleBasedUserForm
              onSubmit={async (data) => {
                try {
                  if (isEditing) {
                    await apiFetchAuth(`/users/${form.id}`, {
                      method: "PUT",
                      body: JSON.stringify(data),
                    });
                    showNotification("success", "User updated successfully.");
                  } else {
                    await apiFetchAuth("/users", {
                      method: "POST",
                      body: JSON.stringify(data),
                    });
                    showNotification("success", "User created successfully.");
                  }
                  resetForm();
                  loadUsers(searchQuery);
                } catch (error) {
                  showNotification("error", "Failed to save user.");
                  console.error(error);
                }
              }}
              branches={branches.filter((b) => b.status === "ACTIVE")}
              categories={categories.filter((c) => c.status === "ACTIVE")}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
