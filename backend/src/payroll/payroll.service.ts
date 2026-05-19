import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as math from 'mathjs';
import {
  payslips_payment_status,
  payslips_payment_mode,
  payroll_batches_status,
  salary_components_component_type,
  salary_components_calculation_type,
  Prisma,
} from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService
  ) { }

  async runPayroll(
    companyId: number,
    periodStart: Date,
    frequency: 'monthly' | 'biweekly' | 'weekly' | '15-day' | 'daily' | string,
    performedBy?: number,
    options?: { 
      index?: number; 
      branchId?: number; 
      employeeIds?: number[];
      distributionBank?: string;
      distributionAccount?: string;
    },
  ) {
    frequency = (frequency || 'monthly').toString().toLowerCase();
    const index = options?.index || 1;

    // derive month/year from periodStart
    const month = periodStart.getMonth() + 1;
    const year = periodStart.getFullYear();

    // compute pay period start/end based on frequency and index
    const lastDay = new Date(year, month, 0).getDate();
    let startDay = 1;
    let endDay = lastDay;
    let label = 'Monthly';

    if (frequency === '15-day' || frequency === '15day') {
      if (index === 2) {
        startDay = 16;
        endDay = lastDay;
        label = 'Semi-monthly (2nd)';
      } else {
        startDay = 1;
        endDay = Math.min(15, lastDay);
        label = 'Semi-monthly (1st)';
      }
    } else if (frequency === 'biweekly' || frequency === 'fortnight') {
      startDay = 1 + (index - 1) * 14;
      endDay = Math.min(lastDay, startDay + 13);
      label = `Biweekly #${index}`;
    } else if (frequency === 'weekly') {
      startDay = 1 + (index - 1) * 7;
      endDay = Math.min(lastDay, startDay + 6);
      label = `Weekly #${index}`;
    } else if (frequency === 'daily') {
      startDay = periodStart.getDate();
      endDay = startDay;
      label = `Daily ${startDay}/${month}/${year}`;
    }

    const pay_period_start = new Date(year, month - 1, startDay);
    const pay_period_end = new Date(year, month - 1, endDay);

    // The check for existing batch was removed to allow processing for remaining
    // eligible employees. Duplicate processing is already prevented below by
    // filtering out employees who already have a payslip in this period.

    // 1. Get employees
    const where: any = { company_id: companyId, is_active: true };
    if (options?.employeeIds && options.employeeIds.length > 0) {
      where.employee_id = { in: options.employeeIds.map(id => Number(id)) };
    } else if (options?.branchId) {
      where.branch_id = Number(options.branchId);
    }

    let employees = await this.prisma.employees.findMany({
      where,
      include: {
        payroll_record: true,
        system_categories: true,
        branches: true
      }
    });

    // 2. Filter out employees who were already paid in THIS period
    const paidPayslips = await this.prisma.payslips.findMany({
      where: {
        company_id: companyId,
        payroll_batches: {
          pay_period_start,
          status: { not: 'Cancelled' }
        }
      },
      select: { employee_id: true }
    });
    const paidIds = new Set(paidPayslips.map(p => p.employee_id));
    
    employees = employees.filter(emp => !paidIds.has(emp.employee_id));

    if (employees.length === 0) {
      throw new BadRequestException('No eligible unpaid employees found for this selection.');
    }

    // 2. Get active salary components/rules for company
    const globalRules = await this.prisma.salary_components.findMany({
      where: { company_id: companyId, is_active: true },
    });

    // 3. Create a Payroll Batch
    let branchId = options?.branchId ? Number(options.branchId) : null;
    if (!branchId) {
      const firstBranch = await this.prisma.branches.findFirst({
        where: { company_id: companyId },
      });
      if (!firstBranch) throw new BadRequestException('Company has no branches');
      branchId = firstBranch.branch_id;
    }

    const distributionInfo = options?.distributionBank ? ` | Dist: ${options.distributionBank} (${options.distributionAccount})` : '';

    const batch = await this.prisma.payroll_batches.create({
      data: {
        company_id: companyId,
        branch_id: branchId,
        batch_code: `PAY-${month}-${year}-${Date.now()}`,
        status: payroll_batches_status.Calculated,
        total_employees: employees.length,
        total_gross: 0,
        total_deductions: 0,
        total_net_payable: 0,
        pay_period_start,
        pay_period_end,
        pay_date: new Date(),
        remarks: `${label}${distributionInfo}`,
      },
    });

    const salaryConfigs = await this.prisma.salary_configurations.findMany({
      where: { company_id: companyId }
    });
    const configMap = new Map<number, any>(salaryConfigs.map(c => [c.category_id, c]));


    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;

    for (const employee of employees) {
      // 1. Determine Basic Salary (Config vs Individual)
      const config = employee.category_id ? configMap.get(employee.category_id) : null;
      const basicSalary = config ? Number((config as any).basic_salary) : (Number(employee.current_base_salary) || 0);
      
      // Track individual allowances and deductions for detailed payslip
      let earnings: Record<string, number> = {
        basic_salary: basicSalary,
        hra: 0,
        conveyance: 0,
        medical_allowance: 0,
        special_allowance: 0,
        bonus: 0,
        other_earnings: 0,
      };

      let deductionsDetail: Record<string, number> = {
        pf_employee: 0,
        professional_tax: 0,
        advance_recovery: 0,
        other_deductions: 0,
      };

      // 2. Add Category-specific Allowances/Bonuses
      if (config) {
        const transport = Number((config as any).transport_allowance || 0);
        const housing = Number((config as any).housing_allowance || 0);
        const meal = Number((config as any).meal_allowance || 0);
        const perfBonus = Number((config as any).performance_bonus || 0);
        const projBonus = Number((config as any).project_bonus || 0);

        earnings.conveyance += transport;
        earnings.hra += housing;
        earnings.medical_allowance += meal;
        earnings.bonus += perfBonus + projBonus;
      }

      // 3. Dynamic Adjustments (Experience, Education)
      const joinDate = new Date(employee.date_of_joining);
      const now = new Date();
      const experienceYears = Math.max(0, now.getFullYear() - joinDate.getFullYear());
      const educationMap: Record<string, number> = {
        'non-Study': 0, 'primary level': 1, 'A2': 2, 'A1': 3, 'A0': 4, 'Masters Degree': 5, 'PHD': 6
      };
      const educationLevelValue = employee.education_level ? (educationMap[employee.education_level] || 0) : 0;

      const totalAllowances = Object.values(earnings).reduce((a, b) => a + b, 0);
      const context = {
        basicSalary,
        grossSalary: totalAllowances,
        experienceYears,
        educationLevel: educationLevelValue,
      };

      // 4. Custom Salary Components
      const esc = await this.prisma.employee_salary_components.findMany({
        where: { employee_id: employee.employee_id },
        include: { salary_components: true },
      });
      const components = esc.map((e) => e.salary_components).filter(Boolean);

      for (const comp of components) {
        let value = 0;
        if (comp.calculation_type === salary_components_calculation_type.Fixed) {
          value = Number(comp.default_value) || 0;
        } else if (comp.calculation_type === salary_components_calculation_type.Formula && comp.formula) {
          try {
            value = math.evaluate(comp.formula, context);
            if (isNaN(value)) value = 0;
          } catch (e) {
            console.error(`Error evaluating formula for ${comp.component_name}:`, e);
          }
        } else if (comp.calculation_type === salary_components_calculation_type.Percentage) {
            value = (Number(comp.default_value) / 100) * basicSalary;
        }

        if (comp.component_type === salary_components_component_type.Earning) {
          // Map component to appropriate payslip field
          const compNameLower = comp.component_name.toLowerCase();
          if (compNameLower.includes('hra') || compNameLower.includes('house rent')) {
            earnings.hra += value;
          } else if (compNameLower.includes('conveyance') || compNameLower.includes('transport')) {
            earnings.conveyance += value;
          } else if (compNameLower.includes('medical')) {
            earnings.medical_allowance += value;
          } else if (compNameLower.includes('special')) {
            earnings.special_allowance += value;
          } else if (compNameLower.includes('bonus')) {
            earnings.bonus += value;
          } else {
            earnings.other_earnings += value;
          }
        } else {
          // Map deduction components
          const compNameLower = comp.component_name.toLowerCase();
          if (compNameLower.includes('pf') && compNameLower.includes('employee')) {
            deductionsDetail.pf_employee += value;
          } else if (compNameLower.includes('professional tax') || compNameLower.includes('pt')) {
            deductionsDetail.professional_tax += value;
          } else if (compNameLower.includes('advance')) {
            deductionsDetail.advance_recovery += value;
          } else {
            deductionsDetail.other_deductions += value;
          }
        }
      }

      const grossSalary = Object.values(earnings).reduce((a, b) => a + b, 0);
      
      // 5. Apply Category-specific Deduction Settings
      if (employee.category_id) {
        const catDeductions = await this.prisma.category_deductions.findMany({
          where: { category_id: employee.category_id, is_enabled: true }
        });
        
        for (const d of catDeductions) {
          const deductionVal = (Number(d.percentage) / 100) * grossSalary;
          const dedNameLower = d.deduction_name.toLowerCase();

          if (dedNameLower.includes('pf') && dedNameLower.includes('employee')) {
            deductionsDetail.pf_employee += deductionVal;
          } else if (dedNameLower.includes('professional tax') || dedNameLower.includes('pt')) {
            deductionsDetail.professional_tax += deductionVal;
          } else if (dedNameLower.includes('advance')) {
            deductionsDetail.advance_recovery += deductionVal;
          } else {
            deductionsDetail.other_deductions += deductionVal;
          }
        }
      }

      const employeeDeductionsBase = Object.values(deductionsDetail).reduce((a, b) => a + b, 0);

      // 6. Apply Branch-Specific Global Deductions
      const branchDeductions = await this.prisma.branch_deductions.findMany({
        where: { company_id: companyId, is_active: true }
      });

      for (const bd of branchDeductions) {
        try {
          const applicableBranches = JSON.parse(bd.branch_ids || '[]');
          if (applicableBranches.includes(employee.branch_id.toString()) || applicableBranches.includes(employee.branch_id)) {
            const deductionVal = Number(bd.amount);
            deductionsDetail.other_deductions += deductionVal;
          }
        } catch (e) {
          console.error('Failed to parse branch_ids for deduction:', bd.id);
        }
      }

      const employeeDeductions = Object.values(deductionsDetail).reduce((a, b) => a + b, 0);
      const netSalary = Math.max(0, grossSalary - employeeDeductions);

      totalGross += grossSalary;
      totalNet += netSalary;
      totalDeductions += employeeDeductions;

      await this.prisma.payslips.create({
        data: {
          employee_id: employee.employee_id,
          company_id: companyId,
          batch_id: batch.batch_id,
          payslip_number: `PSL-${employee.employee_code}-${month}-${year}-${Date.now()}`,
          basic_salary: new Prisma.Decimal(earnings.basic_salary),
          hra: new Prisma.Decimal(earnings.hra),
          conveyance: new Prisma.Decimal(earnings.conveyance),
          medical_allowance: new Prisma.Decimal(earnings.medical_allowance),
          special_allowance: new Prisma.Decimal(earnings.special_allowance),
          bonus: new Prisma.Decimal(earnings.bonus),
          other_earnings: new Prisma.Decimal(earnings.other_earnings),
          total_earnings: new Prisma.Decimal(grossSalary),
          pf_employee: new Prisma.Decimal(deductionsDetail.pf_employee),
          professional_tax: new Prisma.Decimal(deductionsDetail.professional_tax),
          advance_recovery: new Prisma.Decimal(deductionsDetail.advance_recovery),
          other_deductions: new Prisma.Decimal(deductionsDetail.other_deductions),
          total_deductions: new Prisma.Decimal(employeeDeductions),
          net_payable: new Prisma.Decimal(netSalary),
          payment_status: payslips_payment_status.Pending,
          payment_mode: payslips_payment_mode.BankTransfer,
          calculation_data: JSON.stringify({
            category_id: employee.category_id,
            experience: experienceYears,
            education: employee.education_level,
            earnings,
            deductions: deductionsDetail,
          }),
        },
      });
    }


    await this.prisma.payroll_batches.update({
      where: { batch_id: batch.batch_id },
      data: {
        total_gross: new Prisma.Decimal(totalGross),
        total_net_payable: new Prisma.Decimal(totalNet),
        total_deductions: new Prisma.Decimal(totalDeductions),
        total_employees: employees.length,
      },
    });

    await this.audit.log({
      companyId,
      userId: performedBy,
      userType: 'HR_USER',
      action: 'PAYROLL_RUN',
      entityType: 'payroll_batches',
      entityId: batch.batch_id,
      newValues: {
        periodStart: pay_period_start,
        periodEnd: pay_period_end,
        totalGross,
        totalNet,
      },
      remarks: `Payroll processed for period ${pay_period_start.toISOString().slice(0, 10)} - ${pay_period_end.toISOString().slice(0, 10)}`,
    });

    await this.notifications.notifySuperAdmins(
      companyId,
      'New Payroll Batch Submitted',
      `A new payroll batch for ${pay_period_start.toLocaleString('default', { month: 'long', year: 'numeric' })} has been processed and is awaiting your approval.`,
      'GeneralAnnouncement',
      '/payments'
    );

    return {
      message: 'Payroll run successfully. Batch is awaiting approval.',
      batchId: batch.batch_id,
      totalEmployees: employees.length,
      totalNetSalary: totalNet,
    };
  }

  async approveBatch(batchId: number, companyId: number, reviewerId: number) {
    const batch = await this.prisma.payroll_batches.findUnique({
      where: { batch_id: batchId },
    });

    if (!batch || batch.company_id !== companyId) {
      throw new NotFoundException('Payroll batch not found');
    }

    if (batch.status !== payroll_batches_status.Calculated) {
      throw new BadRequestException('Only calculated batches can be approved');
    }

    const updated = await this.prisma.payroll_batches.update({
      where: { batch_id: batchId },
      data: {
        status: payroll_batches_status.Approved,
        approved_at: new Date(),
        approved_by: reviewerId,
      },
    });

    const periodLabel = batch.pay_period_start.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });

    // Notify Branch HR
    await this.notifications.notifyBranchHR(
      batch.branch_id,
      companyId,
      'Payroll Batch Approved',
      `The payroll batch for ${periodLabel} has been approved by the Super Admin.`,
      'GeneralAnnouncement',
      '/branch-management'
    );

    // Notify Employees
    await this.notifications.notifyBatchEmployees(
      batchId,
      companyId,
      'Payslip Available',
      `Your payslip for ${periodLabel} has been approved and is now available for viewing.`,
      'PayslipReady',
      '/my-payslips'
    );

    return updated;
  }

  async markAsPaid(batchId: number, companyId: number, payerId: number) {
    const batch = await this.prisma.payroll_batches.findUnique({
      where: { batch_id: batchId },
      include: {
        payslips: {
          include: {
            employees: true,
          },
        },
      },
    });

    if (!batch || batch.company_id !== companyId) {
      throw new NotFoundException('Payroll batch not found');
    }

    if (batch.status !== payroll_batches_status.Approved) {
      throw new BadRequestException('Only approved batches can be marked as paid');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update batch status
      const updatedBatch = await tx.payroll_batches.update({
        where: { batch_id: batchId },
        data: {
          status: payroll_batches_status.Paid,
          paid_at: new Date(),
          paid_by: payerId,
        },
      });

      // 2. Update all payslips to Paid
      await tx.payslips.updateMany({
        where: { batch_id: batchId },
        data: {
          payment_status: payslips_payment_status.Paid,
          payment_date: new Date(),
        },
      });

      // 3. Notify Employees
      const periodLabel = batch.pay_period_start.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });

      // Execute this directly since it's an external service call that handles the loop internally
      this.notifications.notifyBatchEmployees(
        batchId,
        companyId,
        'Salary Paid',
        `Your salary for ${periodLabel} has been paid and credited to your account.`,
        'SalaryCredited',
        '/payment-history'
      ).catch(err => console.error("Failed to notify employees of salary payment", err));

      return updatedBatch;
    });
  }

  async getPayslips(employeeId: number, companyId: number) {
    return this.prisma.payslips.findMany({
      where: {
        employee_id: employeeId,
        company_id: companyId, // Multi-tenant scoping (CRITICAL)
      },
      orderBy: [{ created_at: 'desc' }],
      include: {
        employees: true,
        payroll_batches: true,
      },
    });
  }

  async getBatches(companyId: number) {
    return this.prisma.payroll_batches.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      include: { branches: true },
    });
  }

  async getAllPayslips(companyId: number) {
    return this.prisma.payslips.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      include: {
        employees: true,
        payroll_batches: true,
      },
    });
  }

  async deleteBatch(batchId: number, companyId: number) {
    const batch = await this.prisma.payroll_batches.findUnique({
      where: { batch_id: batchId },
    });

    if (!batch || batch.company_id !== companyId) {
      throw new NotFoundException('Payroll batch not found');
    }

    if (batch.status === payroll_batches_status.Approved || batch.status === payroll_batches_status.Paid) {
      throw new BadRequestException('Cannot delete an approved or paid payroll batch');
    }

    // Use transaction for safe deletion
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete associated payslips
      await tx.payslips.deleteMany({
        where: { batch_id: batchId },
      });

      // 2. Delete the batch itself
      return tx.payroll_batches.delete({
        where: { batch_id: batchId },
      });
    });
  }

  async cancelBatch(batchId: number, companyId: number, performedBy: number) {
    const batch = await this.prisma.payroll_batches.findUnique({
      where: { batch_id: batchId },
    });

    if (!batch || batch.company_id !== companyId) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.status !== payroll_batches_status.Calculated && batch.status !== payroll_batches_status.Approved) {
      throw new BadRequestException('Only Calculated or Approved batches can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update payslips status to Cancelled/Failed
      await tx.payslips.updateMany({
        where: { batch_id: batchId },
        data: { payment_status: payslips_payment_status.Failed },
      });

      // 2. Update batch status
      const updatedBatch = await tx.payroll_batches.update({
        where: { batch_id: batchId },
        data: { status: payroll_batches_status.Cancelled },
      });

      await this.audit.log({
        companyId,
        userId: performedBy,
        userType: 'HR_USER',
        action: 'PAYROLL_CANCELLED',
        entityType: 'payroll_batches',
        entityId: batchId,
        remarks: `Payroll batch ${batch.batch_code} was cancelled.`,
      });

      return updatedBatch;
    });
  }

  async getPayrollRecords(companyId: number) {
    return this.prisma.payroll_records.findMany({
      where: {
        employees: {
          company_id: companyId
        }
      },
      include: {
        employees: {
          include: {
            payment_profile: true
          }
        }
      }
    });
  }
}


