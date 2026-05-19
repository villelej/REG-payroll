"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Plus,
  ArrowRight,
  ArrowLeft,
  Save,
  Trash2,
  Wallet,
  Building,
  CreditCard,
  UserPlus,
  History,
  X,
  CheckCircle2,
  Edit,
  MoreVertical,
  Users,
  ShieldCheck,
  Scissors,
  MapPin,
  List,
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

const adminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Employee Management", href: "/employee-management", icon: UserPlus },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Payment History", href: "/payment-history", icon: History },
];

interface SalaryComponent {
  name: string;
  amount: number;
}

interface FullConfig {
  id: number;
  categoryName: string;
  categoryCode: string;
  baseSalary: number;
  allowances: number;
  grossSalary: number;
}

export default function SalarySettingsWizard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Wizard Data
  const [categories, setCategories] = useState<any[]>([]);
  const [configs, setConfigs] = useState<FullConfig[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [allowances, setAllowances] = useState<SalaryComponent[]>([]);

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", code: "" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      const [fetchedCats, fetchedConfigs] = await Promise.all([
        apiFetchAuth<any[]>("/categories"),
        apiFetchAuth<any[]>("/salary-settings/configurations")
      ]);
      
      if (fetchedCats) setCategories(fetchedCats);
      
      if (fetchedConfigs) {
        setConfigs(fetchedConfigs.map(c => ({
          id: c.category_id,
          categoryName: c.categories?.category_name || "Unknown",
          categoryCode: c.categories?.category_code || "-",
          baseSalary: Number(c.basic_salary || 0),
          allowances: Number(c.gross_salary || 0) - Number(c.basic_salary || 0),
          grossSalary: Number(c.gross_salary || 0)
        })));
      }
    } catch { }
  }, []);

  useEffect(() => {
    const user = getLoggedUser();
    if (!user || (!isRoleAllowedForRoute(user.role || "", "/admin-dashboard") && !isRoleAllowedForRoute(user.role || "", "/super-admin-dashboard"))) {
      router.replace("/");
      return;
    }
    setUserName(user.fullName || user.username || user.email || "Admin");
    setUserRole(user.role || "");
    loadData();
  }, [router, loadData]);

  const handleNext = () => {
    if (currentStep === 1 && !selectedCategory) {
      showNotification("error", "Please select a category first");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const addAllowance = () => setAllowances([...allowances, { name: "", amount: 0 }]);
  const updateAllowance = (idx: number, field: keyof SalaryComponent, val: any) => {
    const next = [...allowances];
    next[idx] = { ...next[idx], [field]: field === "amount" ? Number(val) : val };
    setAllowances(next);
  };
  const removeAllowance = (idx: number) => setAllowances(allowances.filter((_, i) => i !== idx));

  const totalAllowances = allowances.reduce((acc, a) => acc + a.amount, 0);
  const grossSalary = baseSalary + totalAllowances;

  const handleFinish = async () => {
    try {
      const payload = {
        categoryId: selectedCategory.category_id,
        baseSalary,
        allowances,
        deductions: [], // Always empty as per new logic
      };
      await apiFetchAuth("/salary-settings/save-workflow", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showNotification("success", "Salary settings saved successfully!");
      setCurrentStep(1);
      setSelectedCategory(null);
      setBaseSalary(0);
      setAllowances([]);
      loadData();
    } catch {
      showNotification("error", "Failed to save salary settings");
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetchAuth("/categories", {
        method: "POST",
        body: JSON.stringify({ category_name: newCat.name, category_code: newCat.code, status: "ACTIVE" })
      });
      showNotification("success", "Category created!");
      setIsCatModalOpen(false);
      loadData();
    } catch {
      showNotification("error", "Failed to create category");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this salary configuration?")) return;
    try {
      await apiFetchAuth(`/salary-settings/configurations/${id}`, { method: "DELETE" });
      showNotification("success", "Configuration deleted successfully.");
      loadData();
    } catch {
      showNotification("error", "Failed to delete configuration.");
    }
  };

  const menuItems = (userRole === "SuperAdmin" || userRole === "PlatformAdmin") ? superAdminMenuItems : adminMenuItems;

  return (
    <DashboardLayout
      sidebarConfig={{ 
        title: "Reserve Force Payroll", 
        subtitle: (userRole === "SuperAdmin" || userRole === "PlatformAdmin") ? "Super Admin Portal" : "HR Portal", 
        menuItems 
      }}
      pageTitle="Salary Settings Wizard"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      {/* Wizard Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {s}
              </div>
              <span className={`text-xs font-medium ${currentStep >= s ? "text-indigo-600" : "text-gray-400"}`}>
                {s === 1 ? "Category" : s === 2 ? "Base Salary" : "Allowances & Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {currentStep === 1 && (
          <Panel 
            title="Step 1: Select Salary Category" 
            description="Choose which employee group you want to configure"
            action={
              <Button onClick={() => setIsCatModalOpen(true)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> New Category
              </Button>
            }
          >
            <div className="max-w-md mx-auto py-8 space-y-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Building className="w-8 h-8 text-indigo-600" />
              </div>
              
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-700">Select Category</Label>
                <select
                  value={selectedCategory?.category_id || ""}
                  onChange={(e) => {
                    const cat = categories.find(c => c.category_id === Number(e.target.value));
                    setSelectedCategory(cat);
                  }}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 bg-white focus:border-indigo-600 focus:ring-0 transition-all outline-none text-gray-900 font-medium"
                >
                  <option value="" disabled>-- Choose a category --</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name} ({cat.category_code})
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    No categories found. Please create one first.
                  </p>
                )}
              </div>

              {selectedCategory && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-sm font-bold text-indigo-900">{selectedCategory.category_name}</div>
                      <div className="text-xs text-indigo-600 font-mono">{selectedCategory.category_code}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-center text-gray-400">
                Pick a category to continue setting its base salary and benefits.
              </p>
            </div>
          </Panel>
        )}

        {currentStep === 2 && (
          <Panel title="Step 2: Base Salary" description={`Setting foundation for ${selectedCategory?.category_name}`}>
            <div className="space-y-6 py-8 max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-emerald-600" />
              </div>
              <Label className="text-lg">What is the monthly base salary?</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">RWF</span>
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="pl-14 h-14 text-2xl font-bold text-center border-indigo-100"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-gray-400 italic">This will be the standard pay for everyone in this category.</p>
            </div>
          </Panel>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Panel title="Step 3: Allowances & Review" description={`Final check for ${selectedCategory?.category_name}`}>
                <div className="space-y-6">
                  <div className="space-y-4">
                    {allowances.map((al, idx) => (
                      <div key={idx} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-1 space-y-2">
                          <Label>Allowance Name</Label>
                          <Input value={al.name} onChange={(e) => updateAllowance(idx, "name", e.target.value)} placeholder="e.g. Transport" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Amount (RWF)</Label>
                          <Input type="number" value={al.amount} onChange={(e) => updateAllowance(idx, "amount", e.target.value)} placeholder="0" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeAllowance(idx)} className="text-red-500 hover:bg-red-50 mb-0.5">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button onClick={addAllowance} variant="outline" className="w-full border-dashed border-2 py-4 hover:bg-gray-50">
                      <Plus className="w-4 h-4 mr-2" /> Add New Allowance
                    </Button>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4 tracking-wider">Salary Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Base Salary</span>
                        <span className="font-mono font-semibold">RWF {baseSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-indigo-600">
                        <span>Total Allowances (+)</span>
                        <span className="font-mono font-semibold">RWF {totalAllowances.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
                <h3 className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-2">Final Gross Salary</h3>
                <div className="text-4xl font-bold mb-4">RWF {grossSalary.toLocaleString()}</div>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  This is the total gross pay applied to this category before branch deductions.
                </p>
                <div className="mt-6 pt-6 border-t border-indigo-500/50">
                  <div className="flex items-center gap-2 text-sm text-indigo-100">
                    <CheckCircle2 className="w-4 h-4 text-indigo-300" />
                    <span>Calculated accurately</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between pt-6 border-t border-gray-100">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 text-lg font-semibold shadow-lg shadow-indigo-100">
              <Save className="w-5 h-5 mr-2" /> Save Configuration
            </Button>
          )}
        </div>
      </div>

      <div className="mt-16 space-y-6">
        <SectionHeader title="Salary Overview" description="Currently active salary configurations for all categories" />
        <DataTable
          columns={[
            { key: "categoryName", label: "Category" },
            { key: "categoryCode", label: "Code" },
            { key: "baseSalary", label: "Base Salary", render: (c) => `RWF ${c.baseSalary.toLocaleString()}` },
            { key: "allowances", label: "Allowances (+)", render: (c) => <span className="text-indigo-600 font-medium">+${c.allowances.toLocaleString()}</span> },
            { key: "grossSalary", label: "Gross Salary", render: (c) => <div className="font-bold text-emerald-600">RWF {c.grossSalary.toLocaleString()}</div> },
            { key: "actions", label: "Actions", render: (c) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => {
                    const cat = categories.find(cat => cat.category_id === c.id);
                    if (cat) {
                      setSelectedCategory(cat);
                      setBaseSalary(c.baseSalary);
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-red-600 focus:text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          ]}
          data={configs}
          keyExtractor={(c) => c.id}
          emptyMessage="No salary configurations found."
        />
      </div>

      {/* New Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">New Salary Category</h2>
              <button onClick={() => setIsCatModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createCategory} className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Category Code</Label>
                <Input value={newCat.code} onChange={(e) => setNewCat({ ...newCat, code: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Create Category</Button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
