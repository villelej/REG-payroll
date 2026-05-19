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
import { Branch } from "@/lib/types";

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

const districtMap: Record<string, string[]> = {
  "North": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  "East": ["Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana"],
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  "South": ["Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango"],
  "West": ["Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro"],
};

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [branchForm, setBranchForm] = useState({
    id: 0,
    name: "",
    hubId: "",
    province: "Kigali City",
    district: "Nyarugenge",
    status: "ACTIVE",
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadSystemData = useCallback(async () => {
    try {
      const [fetchedBranches, fetchedUsers] = await Promise.all([
        apiFetchAuth<Record<string, unknown>[]>("/branches"),
        apiFetchAuth<Record<string, unknown>[]>("/users"),
      ]);
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
      if (fetchedUsers) {
        setUsers(fetchedUsers);
      }
    } catch {}
  }, []);

  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadSystemData();
    const user = getLoggedUser();
    if (user) {
      setUserName(user.fullName || user.username || user.email || "Super Admin");
    }
  }, [loadSystemData]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setBranchForm((prev) => {
      const next = { ...prev, [id === "branchName" ? "name" : id === "branchStatus" ? "status" : id]: value };
      if (id === "province") {
        next.district = districtMap[value][0];
      }
      return next;
    });
  };

  const resetForm = () => {
    setBranchForm({ id: 0, name: "", hubId: "", province: "Kigali City", district: "Nyarugenge", status: "ACTIVE" });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const saveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        branch_name: branchForm.name,
        province: branchForm.province,
        district: branchForm.district,
        status: branchForm.status,
      };

      if (branchForm.hubId && branchForm.hubId.toString().trim() !== "") {
        payload.branch_code = branchForm.hubId.toString();
      }

      if (isEditing) {
        await apiFetchAuth(`/branches/${branchForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetchAuth(`/branches`, {
          method: "POST",
          body: JSON.stringify({ ...payload, address_line1: "N/A", city: branchForm.district }),
        });
      }
      resetForm();
      showNotification("success", "Branch saved successfully");
      loadSystemData();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to save branch");
    }
  };

  const editBranch = (id: number) => {
    const b = branches.find((x) => x.id === id);
    if (b) {
      setBranchForm({
        id: b.id,
        name: b.name,
        hubId: b.hubId,
        province: b.province || "Kigali City",
        district: b.district || "Nyarugenge",
        status: b.status,
      });
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const deleteBranch = async (id: number) => {
    const b = branches.find((x) => x.id === id);
    if (!b) return;
    const isInUse = users.some((u) => u.branch === b.name || (u.profile as Record<string, unknown>)?.branch === b.name);
    if (isInUse) {
      showNotification("error", "Branch cannot be deleted because it is in use by one or more users.");
      return;
    }
    if (!confirm("Delete this branch?")) return;
    try {
      await apiFetchAuth(`/branches/${id}`, { method: "DELETE" });
      showNotification("success", "Branch deleted successfully");
      loadSystemData();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to delete branch");
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.hubId.toString().includes(searchQuery) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Super Admin Portal", menuItems: superAdminMenuItems }}
      pageTitle="Branch Management"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <SectionHeader
        title="System Branches"
        description="Manage organizational branches and their locations"
        action={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search branches..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <MapPin className="w-4 h-4 mr-2" />
              Add Branch
            </Button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: "name", label: "Branch Name" },
          { key: "hubId", label: "Branch ID" },
          { key: "province", label: "Province", render: (b: Branch) => b.province || "N/A" },
          { key: "district", label: "District", render: (b: Branch) => b.district || "N/A" },
          { key: "status", label: "Status", render: (b: Branch) => <StatusBadge status={b.status} /> },
          { key: "actions", label: "Actions", render: (b: Branch) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => editBranch(b.id)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteBranch(b.id)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )},
        ]}
        data={filteredBranches}
        keyExtractor={(b) => b.id}
        emptyMessage="No branches found"
      />

      {/* Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Branch" : "Add New Branch"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={saveBranch} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name *</Label>
                  <Input id="branchName" value={branchForm.name} onChange={handleBranchChange} required placeholder="e.g., Kigali Central" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hubId">Branch ID (Auto)</Label>
                  <Input id="hubId" value={branchForm.hubId} onChange={handleBranchChange} placeholder="Leave blank to auto-generate" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <select id="province" value={branchForm.province} onChange={handleBranchChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" required>
                    {Object.keys(districtMap).map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <select id="district" value={branchForm.district} onChange={handleBranchChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" required>
                    {(districtMap[branchForm.province] || []).map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchStatus">Status *</Label>
                  <select id="branchStatus" value={branchForm.status} onChange={handleBranchChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" required>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{isEditing ? "Update Branch" : "Save Branch"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
