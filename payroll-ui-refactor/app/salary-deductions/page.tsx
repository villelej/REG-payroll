"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  History,
  Scissors,
  MapPin,
  List,
  MoreVertical,
  Trash2,
  CreditCard,
  Settings,
  Plus,
  X,
  Power
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardLayout,
  SidebarMenuItem,
  Panel,
  DataTable,
  SectionHeader,
  StatusBadge,
} from "@/components/dashboard";
import { NotificationBanner } from "@/components/notification-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoggedUser, isRoleAllowedForRoute } from "@/lib/auth";
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

interface Branch {
  branch_id: number;
  branch_name: string;
}

interface Deduction {
  id: number;
  deduction_name: string;
  amount: number;
  is_active: boolean;
  branch_ids: string;
}

export default function SalaryDeductionsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    deduction_name: "",
    amount: "",
    branch_ids: [] as number[],
    is_active: true
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      const [fetchedBranches, fetchedDeductions] = await Promise.all([
        apiFetchAuth<any[]>("/branches"),
        apiFetchAuth<Deduction[]>("/branch-deductions")
      ]);
      if (fetchedBranches) setBranches(fetchedBranches);
      if (fetchedDeductions) setDeductions(fetchedDeductions);
    } catch (e) {
      console.error("Failed to load data:", e);
      showNotification("error", "Failed to load data: " + (e as Error).message);
    }
  }, []);

  useEffect(() => {
    const user = getLoggedUser();
    if (!user || !isRoleAllowedForRoute(user.role || "", "/salary-deductions")) {
      router.replace("/");
      return;
    }
    setUserName(user.fullName || user.username || user.email || "Super Admin");
    loadData();
  }, [router, loadData]);

  const toggleBranch = (id: number) => {
    setFormData(prev => ({
      ...prev,
      branch_ids: prev.branch_ids.includes(id)
        ? prev.branch_ids.filter(b => b !== id)
        : [...prev.branch_ids, id]
    }));
  };

  const selectAllBranches = () => {
    setFormData(prev => ({
      ...prev,
      branch_ids: branches.map(b => b.branch_id)
    }));
  };

  const clearBranches = () => {
    setFormData(prev => ({ ...prev, branch_ids: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.branch_ids.length === 0) {
      showNotification("error", "Please select at least one branch");
      return;
    }
    try {
      await apiFetchAuth("/branch-deductions", {
        method: "POST",
        body: JSON.stringify({
          deduction_name: formData.deduction_name,
          amount: Number(formData.amount),
          branch_ids: formData.branch_ids,
          is_active: formData.is_active
        })
      });
      showNotification("success", "Deduction created successfully");
      setIsModalOpen(false);
      setFormData({ deduction_name: "", amount: "", branch_ids: [], is_active: true });
      loadData();
    } catch {
      showNotification("error", "Failed to create deduction");
    }
  };

  const toggleActive = async (id: number) => {
    try {
      await apiFetchAuth(`/branch-deductions/${id}/toggle`, { method: "PUT" });
      showNotification("success", "Status updated successfully");
      loadData();
    } catch {
      showNotification("error", "Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this deduction permanently?")) return;
    try {
      await apiFetchAuth(`/branch-deductions/${id}`, { method: "DELETE" });
      showNotification("success", "Deduction deleted");
      loadData();
    } catch {
      showNotification("error", "Failed to delete deduction");
    }
  };

  return (
    <DashboardLayout
      sidebarConfig={{
        title: "Reserve Force Payroll",
        subtitle: "Super Admin Portal",
        menuItems: superAdminMenuItems,
      }}
      pageTitle="Global Branch Deductions"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Deductions</h2>
            <p className="text-sm text-gray-500 mt-1">Assign global deductions to specific branches and toggle them on/off per month.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
            <Plus className="w-4 h-4 mr-2" /> New Global Deduction
          </Button>
        </div>

        <Panel>
          <DataTable
            columns={[
              { key: "deduction_name", label: "Deduction Name", render: (d) => <span className="font-semibold text-gray-800">{d.deduction_name}</span> },
              { key: "amount", label: "Amount", render: (d) => <span className="text-red-600 font-mono font-medium">- RWF {Number(d.amount).toLocaleString()}</span> },
              { 
                key: "branches", 
                label: "Assigned Branches", 
                render: (d) => {
                  try {
                    const ids = JSON.parse(d.branch_ids || "[]");
                    if (ids.length === branches.length && branches.length > 0) return <span className="text-indigo-600 font-medium">All Branches</span>;
                    return <span className="text-gray-600">{ids.length} Branches</span>;
                  } catch { return "-"; }
                }
              },
              { 
                key: "is_active", 
                label: "Status", 
                render: (d) => (
                  <StatusBadge 
                    status={d.is_active ? "ACTIVE" : "INACTIVE"} 
                    type={d.is_active ? "success" : "neutral"} 
                  />
                )
              },
              { key: "actions", label: "Actions", render: (d) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => toggleActive(d.id)}>
                      <Power className="w-4 h-4 mr-2" /> {d.is_active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(d.id)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            ]}
            data={deductions}
            keyExtractor={(d) => d.id}
            emptyMessage="No global branch deductions configured."
          />
        </Panel>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Global Deduction</h2>
                <p className="text-sm text-gray-500">Create a deduction and assign it to branches.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Deduction Name</Label>
                  <Input 
                    required 
                    value={formData.deduction_name} 
                    onChange={e => setFormData(p => ({ ...p, deduction_name: e.target.value }))}
                    placeholder="e.g. Annual Insurance"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (RWF)</Label>
                  <Input 
                    required 
                    type="number"
                    min="1"
                    value={formData.amount} 
                    onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Assign to Branches</Label>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={selectAllBranches} className="text-indigo-600 hover:text-indigo-700 font-medium">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={clearBranches} className="text-gray-500 hover:text-gray-700 font-medium">Clear</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {branches.map(b => (
                    <label key={b.branch_id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200 shadow-sm hover:shadow">
                      <input 
                        type="checkbox" 
                        checked={formData.branch_ids.includes(b.branch_id)}
                        onChange={() => toggleBranch(b.branch_id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{b.branch_name}</span>
                    </label>
                  ))}
                  {branches.length === 0 && (
                    <div className="col-span-2 text-center text-sm text-gray-500 py-4">No branches available</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Create Deduction
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
