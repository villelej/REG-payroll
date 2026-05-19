import { Injectable } from '@nestjs/common';
import { hr_users_role } from '@prisma/client';

/**
 * Enterprise Authorization Service
 * Handles multi-branch access control and authorization
 */
@Injectable()
export class AuthorizationService {
  /**
   * Get all accessible branch IDs for a user
   * Respects canViewAllBranches permission
   * 
   * @param user - User from JWT payload
   * @returns Array of branch IDs, empty array if user can view all branches
   */
  getAccessibleBranches(user: any): number[] {
    // SuperAdmin has no restrictions
    if (user.role === hr_users_role.SuperAdmin) {
      return [];
    }
    
    // User with "view all" permission has no restrictions
    if (user.canViewAllBranches) {
      return [];
    }
    
    // Return assigned branches, fallback to single branchId for backward compat
    return user.branches || (user.branchId ? [user.branchId] : []);
  }

  /**
   * Check if user can access a specific branch
   * 
   * @param user - User from JWT payload
   * @param branchId - Branch to check access for
   * @returns true if user can access, false otherwise
   */
  canAccessBranch(user: any, branchId: number): boolean {
    if (user.role === hr_users_role.SuperAdmin) {
      return true;
    }
    
    if (user.canViewAllBranches) {
      return true;
    }
    
    const accessibleBranches = this.getAccessibleBranches(user);
    return accessibleBranches.length === 0 || accessibleBranches.includes(branchId);
  }

  /**
   * Build Prisma WHERE clause for filtering by accessible branches
   * 
   * Example usage in service:
   * ```
   * const filter = this.authService.buildBranchFilter(user);
   * const employees = await this.prisma.employees.findMany({
   *   where: {
   *     company_id: user.companyId,
   *     ...filter
   *   }
   * });
   * ```
   * 
   * @param user - User from JWT payload
   * @returns Prisma filter object for branch_id field
   */
  buildBranchFilter(user: any): any {
    const accessibleBranches = this.getAccessibleBranches(user);
    
    // No restriction for SuperAdmin or if branches is empty
    if (user.role === hr_users_role.SuperAdmin || accessibleBranches.length === 0) {
      return {};
    }
    
    // Single branch
    if (accessibleBranches.length === 1) {
      return { branch_id: accessibleBranches[0] };
    }
    
    // Multiple branches - use IN clause
    return { 
      branch_id: { 
        in: accessibleBranches 
      } 
    };
  }

  /**
   * Helper: Check if user role requires branch filtering
   * 
   * @param user - User from JWT payload
   * @returns true if user should be branch-filtered
   */
  shouldFilterByBranch(user: any): boolean {
    const restrictedRoles = [
      hr_users_role.BranchHR,
      hr_users_role.CompanyAdmin,
      hr_users_role.Employee
    ];
    return restrictedRoles.includes(user.role);
  }

  /**
   * Build complete WHERE clause for filtering records
   * Includes both branch and company filtering where applicable
   * 
   * @param user - User from JWT payload
   * @param additionalFilters - Additional WHERE conditions to merge
   * @returns Complete Prisma WHERE clause
   */
  buildAccessFilter(user: any, additionalFilters: any = {}): any {
    const baseFilter: any = {};

    // Add company filter if applicable
    if (user.companyId) {
      baseFilter.company_id = user.companyId;
    }

    // Add branch filter if applicable
    if (this.shouldFilterByBranch(user)) {
      const branchFilter = this.buildBranchFilter(user);
      Object.assign(baseFilter, branchFilter);
    }

    // Merge additional filters
    return { ...baseFilter, ...additionalFilters };
  }
}
