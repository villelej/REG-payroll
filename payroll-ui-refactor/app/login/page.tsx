"use client";

import {
  CreditCard, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Users, UserCog, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UserRole = "user" | "admin" | "super-admin";

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  dashboard: string;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    id: "user",
    title: "Employee",
    description: "View payslips, attendance, and personal information",
    icon: <Users className="h-6 w-6" />,
    dashboard: "/user-dashboard",
    color: "bg-emerald-500",
  },
  {
    id: "admin",
    title: "Admin",
    description: "Manage employees, payroll, and branch operations",
    icon: <UserCog className="h-6 w-6" />,
    dashboard: "/admin-dashboard",
    color: "bg-primary",
  },
  {
    id: "super-admin",
    title: "Super Admin",
    description: "Full system access, user management, and audit logs",
    icon: <Shield className="h-6 w-6" />,
    dashboard: "/super-admin-dashboard",
    color: "bg-amber-500",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    const selectedOption = roleOptions.find((r) => r.id === role);
    if (selectedOption) {
      // Store role in proper format for auth system
      const roleMap: Record<UserRole, string> = {
        user: "employee",
        admin: "admin",
        "super-admin": "superadmin",
      };
      const loggedUser = {
        role: roleMap[role],
        id: 1,
        fullName: `Demo ${selectedOption.title}`,
        email: `demo-${role}@example.com`,
        username: `demo_${role}`,
      };
      localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
      localStorage.setItem("userRole", role);
      router.push(selectedOption.dashboard);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Reserve Force Payroll</h1>
          </div>
          <p className="text-muted-foreground">Click a role to access the dashboard instantly</p>
        </div>

        {/* Role Selection - Direct Access */}
        <div className="grid md:grid-cols-3 gap-4">
          {roleOptions.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto h-14 w-14 rounded-xl ${role.color} flex items-center justify-center text-white mb-3`}>
                  {role.icon}
                </div>
                <CardTitle className="text-lg">{role.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">
                  {role.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          This is a demo system. Click any role card to explore that dashboard.
        </p>
      </div>
    </div>
  );
}
