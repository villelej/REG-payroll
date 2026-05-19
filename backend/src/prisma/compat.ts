import { hr_users_role } from '@prisma/client';

export const ROLES_COMPAT = {
  SUPER_ADMIN: hr_users_role.SuperAdmin,
  HR: hr_users_role.BranchHR,
  EMPLOYEE: hr_users_role.Employee,
  COMPANY_ADMIN: hr_users_role.CompanyAdmin,
  PLATFORM_ADMIN: hr_users_role.PlatformAdmin,
  BRANCH_HR: hr_users_role.BranchHR,
};

export default ROLES_COMPAT;
