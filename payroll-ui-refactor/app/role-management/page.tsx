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
  Trash2,
  Search,
  X,
  Settings,
} from "lucide-react";
import { DashboardLayout, SidebarMenuItem, Panel, DataTable, StatusBadge, SectionHeader } from "@/components/dashboard";
import { NotificationBanner } from "@/components/notification-banner";
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
import { Role } from "@/lib/types";

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

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [roleForm, setRoleForm] = useState({ id: 0, name: "", status: "ACTIVE" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadRoles = useCallback(async () => {
    try {
      const fetchedRoles = await apiFetchAuth<Record<string, unknown>[]>("/roles");
      if (fetchedRoles) {
        setRoles(fetchedRoles.map((r) => ({
          id: r.role_id as number,
          name: r.role_name as string,
          status: r.status as string,
        })));
      }
    } catch {}
  }, []);

  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadRoles();
    const user = getLoggedUser();
    if (user) {
      setUserName(user.fullName || user.username || user.email || "Super Admin");
    }
  }, [loadRoles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setRoleForm((prev) => ({ ...prev, [id === "roleName" ? "name" : id === "roleStatus" ? "status" : id]: value }));
  };

  const resetForm = () => {
    setRoleForm({ id: 0, name: "", status: "ACTIVE" });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { role_name: roleForm.name, status: roleForm.status };
      if (isEditing) {
        await apiFetchAuth(`/roles/${roleForm.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetchAuth(`/roles`, { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      showNotification("success", "Role saved successfully");
      loadRoles();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to save role");
    }
  };

  const editRole = (id: number) => {
    const role = roles.find((r) => r.id === id);
    if (role) {
      setRoleForm({ id: role.id, name: role.name, status: role.status });
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const deleteRole = async (id: number) => {
    if (!confirm("Delete this role?")) return;
    try {
      await apiFetchAuth(`/roles/${id}`, { method: "DELETE" });
      showNotification("success", "Role deleted successfully");
      loadRoles();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Super Admin Portal", menuItems: superAdminMenuItems }}
      pageTitle="Role Management"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <SectionHeader
        title="System Roles"
        description="Manage user roles and access permissions"
        action={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search roles..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: "name", label: "Role Name" },
          { key: "status", label: "Status", render: (r: Role) => <StatusBadge status={r.status} /> },
          { key: "actions", label: "Actions", render: (r: Role) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => editRole(r.id)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteRole(r.id)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )},
        ]}
        data={filteredRoles}
        keyExtractor={(r) => r.id}
        emptyMessage="No roles found"
      />

      {/* Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Role" : "Add New Role"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={saveRole} className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name *</Label>
                  <Input id="roleName" value={roleForm.name} onChange={handleChange} required placeholder="e.g., Manager" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roleStatus">Status *</Label>
                  <select id="roleStatus" value={roleForm.status} onChange={handleChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" required>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{isEditing ? "Update Role" : "Save Role"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
