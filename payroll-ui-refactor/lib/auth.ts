export type LoggedUser = {
  role?: string;
  id?: number;
  fullName?: string;
  email?: string;
  username?: string;
  branchId?: number;
  branch?: string;
  companyId?: number;
};

const normalizeRole = (role: string): string =>
  (role || "").replace(/\s+/g, "").toLowerCase();

export function getDashboardRouteByRole(role: string): string | null {
  const normalizedRole = normalizeRole(role);
  if (["superadmin", "platformadmin"].includes(normalizedRole)) {
    return "/super-admin-dashboard";
  }
  if (["admin", "companyadmin", "branchhr"].includes(normalizedRole)) {
    return "/admin-dashboard";
  }
  if (["user", "employee"].includes(normalizedRole)) {
    return "/user-dashboard";
  }
  return null;
}

export function isRoleAllowedForRoute(role: string, route: string): boolean {
  const normalizedRole = normalizeRole(role);
  // SuperAdmin and PlatformAdmin can access all admin-related routes
  if (["superadmin", "platformadmin"].includes(normalizedRole)) {
    return true;
  }
  
  // Specific routes for Admin/HR
  const adminRoutes = ["/admin-dashboard", "/employee-management", "/payment-history", "/monthly-payment-processing"];
  if (["admin", "companyadmin", "branchhr"].includes(normalizedRole)) {
    return adminRoutes.includes(route) || route === "/admin-dashboard";
  }

  return getDashboardRouteByRole(role) === route;
}

export function getLoggedUser(): LoggedUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("loggedUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoggedUser;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("loggedUser");
}
