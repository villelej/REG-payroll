"use client";

import {
  useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Users, 
  Clock, 
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { getDashboardRouteByRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function HomePage() {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setResetSuccess(params.get("reset") === "success");
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        user: {
          id: number;
          username?: string;
          email: string;
          role: string;
          fullName: string;
          companyId?: number;
          branchId?: number;
          branch?: string;
        };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("loggedUser", JSON.stringify(data.user));

      const route = getDashboardRouteByRole(data.user.role);
      if (!route) {
        setError("No dashboard assigned for this role");
        return;
      }

      setOpen(false);
      router.push(route);
    } catch (err: unknown) {
      let errorMsg = "Login failed. Please use valid credentials.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.message) {
            errorMsg = Array.isArray(parsed.message) ? parsed.message.join("\n") : parsed.message;
          }
        } catch {
          if (err.message && err.message.length > 0 && !err.message.startsWith('{')) {
            errorMsg = err.message;
          }
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: resetEmail }),
      });
      setOpen(false);
      setForgotMode(false);
      const emailQuery = encodeURIComponent(resetEmail.trim());
      router.push(`/forgot-password/check-email?email=${emailQuery}`);
    } catch {
      setError("Unable to submit request now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Centralized employee records, salary categories, and contract management in one place.",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description: "Unified authentication system for Super Admin, Admin, and all system users.",
    },
    {
      icon: Clock,
      title: "Audit Ready",
      description: "Comprehensive status tracking and timestamps across all reserve force operations.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1">
                <img src="/reg.png" alt="REG Logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Rwanda Energy Group</p>
                <p className="text-sm font-semibold text-gray-900">Reserve Force Payroll</p>
              </div>
            </div>
            <Button
              onClick={() => setOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Reset Success Banner */}
        {resetSuccess && (
          <div className="bg-green-50 border-b border-green-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <p className="text-green-700 text-sm text-center font-medium">
                Password updated successfully. Please login with your new password.
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider mb-4">
              Secure Payroll Platform
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight text-balance">
              Manage reserve force payroll with confidence
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto text-pretty">
              Centralized management for employees, salary categories, deductions, payments, 
              and access control. Built for security and efficiency.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setOpen(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base"
              >
                Sign In
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t border-blue-200 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-blue-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              Confidential system access only. Unauthorized access is prohibited.
            </p>
          </div>
        </footer>
      </main>

      {/* Login Modal */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm overflow-hidden p-1">
                  <img src="/reg.png" alt="REG Logo" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {forgotMode ? "Reset Password" : "Welcome back"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {forgotMode 
                      ? "Enter your email to receive a reset link" 
                      : "Sign in to your account"
                    }
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {!forgotMode ? (
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Username or Email</Label>
                    <Input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your username or email"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setError("");
                    }}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot your password?
                  </button>
                </form>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Registered Email</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="h-11"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setError("");
                    }}
                    className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Back to Sign In
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
