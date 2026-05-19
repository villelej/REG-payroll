"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  History,
  UserPlus,
  CheckCircle,
  Lock,
  Ban,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  DashboardLayout,
  SidebarMenuItem,
  MetricCard,
  Panel,
  SectionHeader,
} from "@/components/dashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { getLoggedUser, isRoleAllowedForRoute } from "@/lib/auth";
import { apiFetchAuth } from "@/lib/api";

const adminMenuItems: SidebarMenuItem[] = [
  { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Employee Management", href: "/employee-management", icon: UserPlus },
  { label: "Salary Settings", href: "/salary-settings", icon: Settings },
  { label: "Payment Processing", href: "/monthly-payment-processing", icon: CreditCard },
  { label: "Payment History", href: "/payment-history", icon: History },
];

const salaryTrendData = [
  { month: "Jan", amount: 45000000 },
  { month: "Feb", amount: 48000000 },
  { month: "Mar", amount: 47500000 },
  { month: "Apr", amount: 52000000 },
  { month: "May", amount: 51000000 },
  { month: "Jun", amount: 55000000 },
];

const PAYROLL_STATUS_COLORS: Record<string, string> = {
  Draft: "#94a3b8", // Slate 400
  PendingApproval: "#f59e0b", // Amber 500
  Approved: "#3b82f6", // Blue 500
  Paid: "#22c55e", // Green 500
  Failed: "#ef4444" // Red 500
};

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    blockedEmployees: 0,
    lockedEmployees: 0,
    totalPayroll: "RWF 0",
    growth: "0%"
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [salaryTrend, setSalaryTrend] = useState<any[]>([]);
  const [payrollStatusData, setPayrollStatusData] = useState<{name: string, value: number, color: string}[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetchAuth<any>("/stats/users");
      if (data) {
        setStats(prev => ({
          ...prev,
          totalEmployees: data.totalEmployees || data.totalUsers || 0,
          activeEmployees: data.activeUsers || 0,
          blockedEmployees: data.blockedUsers || 0,
          lockedEmployees: data.lockedUsers || 0,
        }));
      }

      const batches = await apiFetchAuth<any[]>("/payroll/batches");
      if (batches && batches.length > 0) {
        const latestBatch = batches[0];
        setStats(prev => ({
          ...prev,
          totalPayroll: `RWF ${(Number(latestBatch.total_net_payable || 0) / 1000000).toFixed(1)}M`,
        }));
        setRecentActivities(batches.slice(0, 5).map(b => ({
          id: b.batch_id,
          type: "PAYROLL",
          title: `Payroll Processed: ${b.remarks || b.batch_code}`,
          time: new Date(b.created_at).toLocaleDateString(),
          status: b.status
        })));

        // Generate trend from batches
        const trend = batches.slice(0, 6).reverse().map(b => ({
          month: new Date(b.pay_period_start || b.created_at).toLocaleString('default', { month: 'short' }),
          amount: Number(b.total_net_payable || 0)
        }));
        setSalaryTrend(trend);
      }

      const statusData = await apiFetchAuth<any[]>("/stats/payroll-status");
      if (statusData && statusData.length > 0) {
        setPayrollStatusData(statusData.map(s => ({
          name: s.status,
          value: s.count,
          color: PAYROLL_STATUS_COLORS[s.status] || "#6366f1"
        })));
      } else {
        setPayrollStatusData([
          { name: "No Data", value: 1, color: "#e2e8f0" }
        ]);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    }
  }, []);

  useEffect(() => {
    const user = getLoggedUser();
    if (!user || !isRoleAllowedForRoute(user.role || "", "/admin-dashboard")) {
      router.replace("/");
      return;
    }
    setUserName(user.fullName || user.username || user.email || "Admin");
    loadStats();
  }, [router, loadStats]);

  return (
    <DashboardLayout
      sidebarConfig={{ title: "Reserve Force Payroll", subtitle: "Admin Portal", menuItems: adminMenuItems }}
      pageTitle="HR Overview"
      userName={userName}
    >
      <div className="space-y-6">
        <SectionHeader
          title="Administrative Overview"
          description="Real-time insights and payroll performance metrics"
        />

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Employees"
            value={stats.totalEmployees}
            icon={Users}
          />
          <MetricCard
            label="Active Workforce"
            value={stats.activeEmployees}
            icon={CheckCircle}
          />
          <MetricCard
            label="Total Monthly Payroll"
            value={stats.totalPayroll}
            icon={DollarSign}
          />
          <MetricCard
            label="Pending Approvals"
            value={stats.lockedEmployees + stats.blockedEmployees}
            icon={Activity}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Salary Trends */}
          <Panel title="Salary Trends (Last 6 Months)" className="lg:col-span-2">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salaryTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value.toLocaleString()} RWF`, "Amount"]}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Payroll Status Distribution */}
          <Panel title="Payroll Status Breakdown">
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payrollStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {payrollStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {payrollStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.name === "No Data" ? 0 : item.value} Batches</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payroll Activity */}
          <Panel title="Recent Payroll Activity">
            <div className="mt-4 space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-center py-8 text-gray-500 italic">No recent payroll activity</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${activity.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                        }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          {/* Quick Stats Summary */}
          <Panel title="Quick Stats Summary">
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-600">+4.2%</span>
                </div>
                <p className="text-xs text-indigo-700 uppercase font-bold tracking-wider">Payroll Growth</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">Steady</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600">Stable</span>
                </div>
                <p className="text-xs text-emerald-700 uppercase font-bold tracking-wider">Retention Rate</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">98%</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold text-amber-600">Warning</span>
                </div>
                <p className="text-xs text-amber-700 uppercase font-bold tracking-wider">Pending Approvals</p>
                <p className="text-xl font-bold text-amber-900 mt-1">{stats.lockedEmployees + stats.blockedEmployees} actions awaiting SuperAdmin</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
