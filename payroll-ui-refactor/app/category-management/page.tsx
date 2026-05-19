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
import { Category } from "@/lib/types";

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

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [categoryForm, setCategoryForm] = useState({ id: 0, name: "", code: "", status: "ACTIVE" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadCategories = useCallback(async () => {
    try {
      const fetchedCategories = await apiFetchAuth<Record<string, unknown>[]>("/categories");
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
    loadCategories();
    const user = getLoggedUser();
    if (user) {
      setUserName(user.fullName || user.username || user.email || "Super Admin");
    }
  }, [loadCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [id === "categoryName" ? "name" : id === "categoryCode" ? "code" : id === "categoryStatus" ? "status" : id]: value
    }));
  };

  const resetForm = () => {
    setCategoryForm({ id: 0, name: "", code: "", status: "ACTIVE" });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { category_name: categoryForm.name, status: categoryForm.status };
      if (categoryForm.code && categoryForm.code.trim() !== "") {
        payload.category_code = categoryForm.code;
      }
      if (isEditing) {
        await apiFetchAuth(`/categories/${categoryForm.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetchAuth(`/categories`, { method: "POST", body: JSON.stringify(payload) });
      }
      resetForm();
      showNotification("success", "Category saved successfully");
      loadCategories();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const editCategory = (id: number) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setCategoryForm({ id: cat.id, name: cat.name, code: cat.code, status: cat.status });
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await apiFetchAuth(`/categories/${id}`, { method: "DELETE" });
      showNotification("success", "Category deleted successfully");
      loadCategories();
    } catch (err: unknown) {
      showNotification("error", err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Super Admin Portal", menuItems: superAdminMenuItems }}
      pageTitle="Category Management"
      userName={userName}
    >
      {notification && (
        <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <SectionHeader
        title="Salary Categories"
        description="Manage salary categories and pay scales"
        action={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <List className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        }
      />

      <DataTable
        columns={[
          { key: "name", label: "Category Name" },
          { key: "code", label: "Category Code" },
          { key: "status", label: "Status", render: (c: Category) => <StatusBadge status={c.status} /> },
          { key: "actions", label: "Actions", render: (c: Category) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => editCategory(c.id)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteCategory(c.id)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )},
        ]}
        data={filteredCategories}
        keyExtractor={(c) => c.id}
        emptyMessage="No categories found"
      />

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Category" : "Add New Category"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={saveCategory} className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input id="categoryName" value={categoryForm.name} onChange={handleChange} required placeholder="e.g., Officer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryCode">Category Code (Auto)</Label>
                  <Input id="categoryCode" value={categoryForm.code} onChange={handleChange} placeholder="Leave blank to auto-generate" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryStatus">Status *</Label>
                  <select id="categoryStatus" value={categoryForm.status} onChange={handleChange} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" required>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{isEditing ? "Update Category" : "Save Category"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
