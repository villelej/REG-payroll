import { Injectable, BadRequestException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PayrollEligibleService {
  constructor(
    private prisma: PrismaService,
    private payrollService: PayrollService
  ) {}

  async getEligibleEmployees(companyId: number, branchId: number | null | undefined, month: number, year: number) {
    try {
      // 1. Get all active employees for this branch (or company if branchId is null)
      const where: any = {
        company_id: companyId,
        is_active: true,
      };
      if (branchId) {
        where.branch_id = branchId;
      }

      const employees = await this.prisma.employees.findMany({
        where,
        include: {
          payroll_record: true,
          system_categories: true,
          payment_profile: true,
          branches: true,
        }
      });

      const periodStart = new Date(year, month - 1, 1);

      const existingPayslips = await this.prisma.payslips.findMany({
        where: {
          company_id: companyId,
          payroll_batches: {
            pay_period_start: periodStart,
            status: { not: 'Cancelled' }
          }
        },
        select: { employee_id: true }
      });

      const paidIds = new Set(existingPayslips.map(p => p.employee_id));

      return employees
        .filter(emp => {
          const record = (emp as any).payroll_record;
          return emp.category_id || (emp.current_base_salary && Number(emp.current_base_salary) > 0) || record;
        })
        .map(emp => {
          const isPaid = paidIds.has(emp.employee_id);
          const record = (emp as any).payroll_record;
          const profile = (emp as any).payment_profile;
          const category = (emp as any).system_categories;
          const branch = (emp as any).branches;
          
          return {
            id: emp.employee_id,
            fullName: emp.full_name || `${emp.first_name} ${emp.last_name}`,
            category: category?.category_name || 'N/A',
            branch: branch?.branch_name || 'N/A',
            paymentMethod: profile?.payment_method || 'N/A',
            paymentNumber: profile?.account_number || profile?.phone_number || '-',
            grossSalary: record ? Number(record.gross_salary) : 0,
            totalDeductions: record ? Number(record.total_deductions) : 0,
            netSalary: record ? Number(record.net_salary) : 0,
            status: isPaid ? 'Paid' : 'Eligible'
          };
        });
    } catch (error) {
      console.error('Error in getEligibleEmployees:', error);
      throw error;
    }
  }
}
