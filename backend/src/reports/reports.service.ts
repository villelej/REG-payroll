import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getBranchDistribution(companyId: number) {
    const branches = await this.prisma.branches.findMany({
      where: { company_id: companyId },
    });
    const result: { branch: string; employees: number }[] = [];
    for (const b of branches) {
      const count = await this.prisma.employees.count({
        where: { branch_id: b.branch_id },
      });
      result.push({ branch: b.branch_name, employees: count });
    }
    return result;
  }

  async getAnnualSalaries(companyId: number, year: number) {
    // fetch payslips with their payroll batch period start
    const payslips = await this.prisma.payslips.findMany({
      where: { company_id: companyId },
      select: { net_payable: true, batch_id: true },
    });
    const batchIds = Array.from(
      new Set(payslips.map((p) => p.batch_id).filter(Boolean)),
    );
    const batches = batchIds.length
      ? await this.prisma.payroll_batches.findMany({
          where: { batch_id: { in: batchIds } },
          select: { batch_id: true, pay_period_start: true },
        })
      : [];
    const batchMap = new Map(
      batches.map((b) => [b.batch_id, b.pay_period_start]),
    );

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const summary = months.map((m, i) => {
      const total = payslips
        .filter((p) => {
          const ps = batchMap.get(p.batch_id);
          if (!ps) return false;
          const d = new Date(ps);
          return d.getFullYear() === year && d.getMonth() === i;
        })
        .reduce((sum, p) => sum + Number(p.net_payable), 0);
      return { month: m, total };
    });
    return summary;
  }

  async getStats(companyId: number) {
    const [totalEmployees, activeEmployees, totalBranches, totalDepartments] =
      await Promise.all([
        this.prisma.employees.count({ where: { company_id: companyId } }),
        this.prisma.employees.count({
          where: { company_id: companyId, is_active: true },
        }),
        this.prisma.branches.count({ where: { company_id: companyId } }),
        this.prisma.departments.count({ where: { company_id: companyId } }),
      ]);

    const latestBatch = await this.prisma.payroll_batches.findFirst({
      where: { company_id: companyId, status: 'Paid' },
      orderBy: { pay_date: 'desc' },
    });

    return {
      totalEmployees,
      activeEmployees,
      totalBranches,
      totalDepartments,
      lastPayrollAmount: latestBatch
        ? Number(latestBatch.total_net_payable)
        : 0,
      lastPayrollDate: latestBatch ? latestBatch.pay_date : null,
    };
  }

  async getDistribution(companyId: number) {
    const departments = await this.prisma.departments.findMany({
      where: { company_id: companyId },
    });
    const distribution = await Promise.all(
      departments.map(async (d) => {
        const count = await this.prisma.employees.count({
          where: { department_id: d.department_id },
        });
        return { label: d.department_name, value: count };
      }),
    );
    return distribution.filter((d) => d.value > 0);
  }

  async getEmploymentStatusDistribution(companyId: number) {
    const employees = await this.prisma.employees.findMany({
      where: { company_id: companyId },
      select: { employment_status: true },
    });
    const counts = employees.reduce((acc, curr) => {
      acc[curr.employment_status] = (acc[curr.employment_status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }

  async getPersonalSalaryHistory(employeeId: number) {
    const payslips = await this.prisma.payslips.findMany({
      where: { employee_id: employeeId },
      orderBy: { created_at: 'desc' },
      take: 6,
      include: { payroll_batches: true },
    });

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return payslips.reverse().map((p) => {
      const date = new Date(p.payroll_batches.pay_period_start);
      return {
        label: `${months[date.getMonth()]} ${date.getFullYear()}`,
        value: Number(p.net_payable),
      };
    });
  }

  async getPersonalLeaveBalance(employeeId: number) {
    const balances = await this.prisma.leave_balances.findMany({
      where: { employee_id: employeeId },
      include: { leave_types: true },
    });
    return balances.map((b) => ({
      label: b.leave_types.leave_name,
      used: Number(b.used_days),
      remaining: Number(b.closing_balance),
    }));
  }
}
