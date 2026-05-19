import { Injectable } from '@nestjs/common';
import { hr_users_role } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly allowedRoles: hr_users_role[] = [
    hr_users_role.PlatformAdmin,
    hr_users_role.SuperAdmin,
    hr_users_role.CompanyAdmin,
    hr_users_role.BranchHR,
    hr_users_role.Employee,
  ];

  private normalizeRole(role?: string): string {
    return (role || '').replace(/\s+/g, '').toLowerCase();
  }

  private buildScopedWhere(actor: any) {
    const where: any = {
      role: { in: this.allowedRoles },
    };

    const role = this.normalizeRole(actor?.role);
    if (role === this.normalizeRole(hr_users_role.BranchHR)) {
      where.role = hr_users_role.Employee;
    } else if (role === this.normalizeRole(hr_users_role.Employee)) {
      where.user_id = actor.userId;
    }

    return where;
  }

  async getUserStats(actor: any) {
    const baseWhere = this.buildScopedWhere(actor);

    // explicit mapping per user request
    const totalUsersWhere = {
      ...baseWhere,
      role: {
        in: [
          hr_users_role.SuperAdmin,
          hr_users_role.CompanyAdmin,
          hr_users_role.BranchHR,
          hr_users_role.Employee,
        ],
      },
    };

    const totalEmployeesWhere = {
      ...baseWhere,
      role: hr_users_role.Employee,
    };

    const [totalUsers, activeUsers, blockedUsers, lockedUsers, totalEmployees] = await Promise.all([
      this.prisma.hr_users.count({ where: totalUsersWhere }),
      this.prisma.hr_users.count({ where: { ...baseWhere, is_active: true } }),
      this.prisma.hr_users.count({ where: { ...baseWhere, is_active: false } }),
      this.prisma.hr_users.count({ where: { ...baseWhere, is_locked: true } }),
      this.prisma.hr_users.count({ where: totalEmployeesWhere }),
    ]);

    // Active Roles: number of roles in the system
    const activeRoles = 3;

    return { totalUsers, activeUsers, blockedUsers, lockedUsers, totalEmployees, activeRoles };
  }

  async usersByRole(actor: any) {
    const where = this.buildScopedWhere(actor);

    return this.prisma.hr_users.groupBy({
      by: ['role'],
      where,
      _count: { role: true },
    });
  }

  async usersByBranch(actor: any) {
    const where = this.buildScopedWhere(actor);

    const grouped = await this.prisma.hr_users.groupBy({
      by: ['branch_id'],
      where,
      _count: { branch_id: true },
    });

    const branchIds = grouped.map(g => g.branch_id).filter(id => id !== null) as number[];
    const branches = await this.prisma.branches.findMany({
      where: { branch_id: { in: branchIds } }
    });

    return grouped.map((g) => {
      const branch = branches.find(b => b.branch_id === g.branch_id);
      return {
        branch_name: branch ? branch.branch_name : 'Unassigned',
        _count: {
          branch_id: g._count.branch_id
        }
      };
    });
  }

  async payrollStatusBreakdown(actor: any) {
    const where: any = { company_id: actor.companyId };
    
    const role = this.normalizeRole(actor.role);
    if (role === this.normalizeRole(hr_users_role.BranchHR)) {
      const user = await this.prisma.hr_users.findUnique({ where: { user_id: actor.userId } });
      if (user?.branch_id) {
        where.branch_id = user.branch_id;
      }
    } else if (role === this.normalizeRole(hr_users_role.Employee)) {
      // Employees don't see system-wide payroll batch stats
      return [];
    }

    const grouped = await this.prisma.payroll_batches.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    return grouped.map(g => ({
      status: g.status,
      count: g._count.status
    }));
  }
}

