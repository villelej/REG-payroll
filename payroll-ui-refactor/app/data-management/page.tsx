"use client";

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
  Settings,
} from "lucide-react";
import { DashboardLayout, SidebarMenuItem, Panel, SectionHeader } from "@/components/dashboard";

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

export default function DataManagement() {
  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Super Admin Portal", menuItems: superAdminMenuItems }}
      pageTitle="Data Management"
    >
      <SectionHeader
        title="Data Management"
        description="Manage system data, backups, and migrations"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Data Export">
          <p className="text-gray-600 mb-4">
            Export system data for reporting and analysis purposes.
          </p>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Export Users Data
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Export Payment Records
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Export Branch Data
            </button>
          </div>
        </Panel>

        <Panel title="Data Import">
          <p className="text-gray-600 mb-4">
            Import data from external sources or restore from backups.
          </p>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Import Employees
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Import Categories
            </button>
            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Restore from Backup
            </button>
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
