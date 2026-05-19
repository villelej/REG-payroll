"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  History,
  Scissors,
  MapPin,
  List,
  Activity,
  UserPlus,
  Settings,
  CreditCard,
} from "lucide-react";
import { DashboardLayout, SidebarMenuItem, MetricCard, Panel } from "@/components/dashboard";
import { apiFetchAuth } from "@/lib/api";
import { getLoggedUser } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function SuperAdminDashboard() {
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    lockedUsers: 0,
    totalEmployees: 0,
    activeRoles: 0,
  });
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [usersByBranch, setUsersByBranch] = useState<any[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [stats, byRole, byBranch] = await Promise.all([
          apiFetchAuth<any>("/stats/users"),
          apiFetchAuth<any[]>("/stats/users-by-role"),
          apiFetchAuth<any[]>("/stats/users-by-branch"),
        ]);
        if (stats) setSummary(stats);
        if (byRole) setUsersByRole(byRole);
        if (byBranch) setUsersByBranch(byBranch);
      } catch (err) {
        console.error("Failed to load super admin dashboard data:", err);
      }
    };
    loadOverview();

    const user = getLoggedUser();
    if (user) {
      setUserName(user.fullName || user.username || user.email || "Super Admin");
    }
  }, []);

  const metrics = [
    { label: "Total Platform Users", value: summary.totalUsers, icon: Users },
    { label: "Total Employees", value: summary.totalEmployees, icon: UserPlus },
    { label: "System Security", value: summary.activeRoles, icon: ShieldCheck },
    { label: "Active Sessions", value: summary.activeUsers, icon: Activity },
  ];

  const roleData = usersByRole.map((item, i) => ({
    name: item.role,
    value: item._count?.role || 0,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  const branchData = usersByBranch.map(b => ({
    name: b.branch_name,
    count: b._count?.branch_id || 0
  }));

  return (
    <DashboardLayout
      sidebarConfig={{
        title: "Reserve Force Payroll",
        subtitle: "Super Admin Portal",
        menuItems: superAdminMenuItems,
      }}
      pageTitle="System Overview"
      userName={userName}
    >
      <div className="space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
            />
          ))}
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Role Distribution Across Platform">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {roleData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Workforce by Branch">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
