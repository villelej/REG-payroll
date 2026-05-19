import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CodeGeneratorService } from '../common/services/code-generator.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { hr_users_role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private codeGenerator: CodeGeneratorService,
  ) {}

  async create(dto: CreateEmployeeDto, creatorRole: hr_users_role) {
    // Check if user already exists
    const existingUser = await this.prisma.hr_users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Always generate employeeCode if not provided or empty
    if (!dto.employeeCode || (typeof dto.employeeCode === 'string' && dto.employeeCode.trim() === '')) {
      dto.employeeCode = await this.codeGenerator.generateCode('EMPLOYEE', dto.companyId);
    }

    // Final validation before saving
    if (!dto.employeeCode || typeof dto.employeeCode !== 'string' || dto.employeeCode.trim() === '') {
      throw new BadRequestException('Failed to generate employee code. Please try again.');
    }

    const activationToken = uuidv4();

    // Use transaction to create both User and Employee profile
    return this.prisma.client.$transaction(async (tx) => {
      // 1. Create Employee Profile
      const employee = await tx.employees.create({
        data: {
          employee_code: dto.employeeCode as string,
          first_name: dto.firstName,
          last_name: dto.lastName,
          date_of_birth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          personal_email: dto.email,
          phone_number: '', // Placeholder
          national_id: dto.nationalId,
          bank_account_number: dto.bankAccount,
          bank_account_holder: `${dto.firstName} ${dto.lastName}`,
          bank_name: 'Default Bank',
          bank_ifsc_code: '0000',
          company_id: dto.companyId,
          branch_id: dto.branchId,
          department_id: dto.departmentId,
          post_id: dto.postId,
          date_of_joining: new Date(),
          current_base_salary: dto.baseSalary,
        },
      });

      // 2. Create User Account linked to Employee
      const user = await tx.hr_users.create({
        data: {
          email: dto.email,
          username: dto.employeeCode as string,
          full_name: `${dto.firstName} ${dto.lastName}`,
          role: hr_users_role.Employee,
          password_hash: '', // Set on activation
          activation_token: activationToken,
          is_active: false,
          employee_id: employee.employee_id,
        },
      });

      // Update employee status based on creator role
      const status =
        creatorRole === hr_users_role.SuperAdmin ? 'Active' : 'Pending';
      await tx.employees.update({
        where: { employee_id: employee.employee_id },
        data: { employment_status: status },
      });

      return {
        message: 'Employee registered. Activation token generated.',
        employeeId: employee.employee_id,
        userId: user.user_id,
        activationToken,
      };
    });
  }

  async findAll(companyId: number, branchId?: number) {
    const where: any = { company_id: companyId };
    if (branchId) {
      where.branch_id = branchId;
    }
    return this.prisma.employees.findMany({
      where,
    });
  }

  async findOne(id: number, companyId: number) {
    const employee = await this.prisma.employees.findUnique({
      where: { employee_id: id },
    });
    if (!employee || employee.company_id !== companyId) {
      throw new BadRequestException('Employee not found or access denied');
    }
    return employee;
  }

  async getProfile(userId: number) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
    });
    if (!user) throw new BadRequestException('User not found');
    if (!user.employee_id) return null;
    const employee = await this.prisma.employees.findUnique({
      where: { employee_id: user.employee_id },
    });
    return employee;
  }

  async updateProfile(userId: number, dto: any) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
      include: { employees: true }
    });
    if (!user || !user.employee_id)
      throw new BadRequestException('Employee record not found');

    // Create a change request instead of direct update
    const request = await this.prisma.employee_change_requests.create({
      data: {
        employee_id: user.employee_id,
        company_id: user.company_id || 1,
        request_type: 'BankAccountUpdate', // Default for now, can be dynamic
        old_value: JSON.stringify(user.employees || {}),
        new_value: JSON.stringify(dto),
        reason: 'Employee self-update',
        status: 'Pending',
      }
    });

    // Notify Super Admins
    if (user.employees) {
      const emp = user.employees as any;
      await this.notifications.notifySuperAdmins(
        user.company_id || 1,
        'New Profile Change Request',
        `${emp.first_name} ${emp.last_name} has requested profile updates.`,
        'ProfileUpdated',
        `/admin/change-requests`
      );
    }

    return request;
  }

  async getPendingChangeRequests(companyId: number) {
    return this.prisma.employee_change_requests.findMany({
      where: { 
        company_id: companyId,
        status: 'Pending'
      },
      include: {
        employees: true
      },
      orderBy: { submitted_at: 'desc' }
    });
  }

  async reviewChangeRequest(requestId: number, status: 'Approved' | 'Rejected', remarks: string, reviewerId: number) {
    const request = await this.prisma.employee_change_requests.findUnique({
      where: { request_id: requestId },
      include: { employees: true }
    });

    if (!request) throw new NotFoundException('Change request not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const updatedRequest = await tx.employee_change_requests.update({
        where: { request_id: requestId },
        data: {
          status,
          review_remarks: remarks,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        }
      });

      // 2. If approved, apply changes to employee record
      if (status === 'Approved') {
        const newData = JSON.parse(request.new_value);
        await tx.employees.update({
          where: { employee_id: request.employee_id },
          data: newData
        });
      }

      // 3. Notify employee
      const hrUser = await tx.hr_users.findFirst({
        where: { employee_id: request.employee_id }
      });

      if (hrUser) {
        await this.notifications.notifyUser(
          hrUser.user_id,
          request.company_id,
          `Profile Update ${status}`,
          `Your request to update your profile has been ${status.toLowerCase()}${remarks ? `: ${remarks}` : '.'}`,
          status === 'Approved' ? 'ChangeRequestApproved' : 'ChangeRequestRejected',
          '/user-dashboard'
        );
      }

      return updatedRequest;
    });
  }

  async getSalaryChart(userId: number) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
    });
    if (!user || !user.employee_id)
      throw new BadRequestException('Employee record not found');

    const payslips = await this.prisma.payslips.findMany({
      where: { employee_id: user.employee_id },
      orderBy: { created_at: 'desc' },
      take: 6,
    });

    return payslips.reverse().map((p) => ({
      month: new Date(p.created_at).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      }),
      netPay: Number(p.net_payable),
    }));
  }

  async getSalaryBreakdown(userId: number) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
    });
    if (!user || !user.employee_id)
      throw new BadRequestException('Employee record not found');

    // Try to get latest payslip for actual breakdown, or use base salary
    const latestPayslip = await this.prisma.payslips.findFirst({
      where: { employee_id: user.employee_id },
      orderBy: { created_at: 'desc' },
    });

    if (latestPayslip) {
      return [
        { label: 'Basic Salary', value: Number(latestPayslip.basic_salary) },
        {
          label: 'Allowances',
          value:
            Number(latestPayslip.total_earnings) -
            Number(latestPayslip.basic_salary),
        },
        { label: 'Deductions', value: Number(latestPayslip.total_deductions) },
      ];
    }

    const employee = await this.prisma.employees.findUnique({
      where: { employee_id: user.employee_id },
    });
    if (!employee) throw new BadRequestException('Employee profile not found');

    return [
      { label: 'Basic Salary', value: Number(employee.current_base_salary) },
      { label: 'Allowances', value: 0 },
      { label: 'Deductions', value: 0 },
    ];
  }

  async approve(id: number, status: any) {
    return this.prisma.employees.update({
      where: { employee_id: id },
      data: { employment_status: status },
    });
  }

  async transfer(id: number, dto: any) {
    return this.prisma.client.$transaction(async (tx) => {
      // 1. Create transfer record
      const transfer = await tx.employee_transfers.create({
        data: {
          employee_id: id,
          company_id: dto.companyId,
          from_branch_id: dto.fromBranchId,
          to_branch_id: dto.toBranchId,
          from_department_id: dto.fromDepartmentId,
          to_department_id: dto.toDepartmentId,
          from_post_id: dto.fromPostId,
          to_post_id: dto.toPostId,
          transfer_date: new Date(dto.transferDate),
          effective_from: new Date(dto.transferDate),
          transfer_type: dto.transferType || 'Permanent',
          transfer_reason: dto.transferReason,
          status: 'Initiated',
          initiated_by: dto.initiatedBy,
        },
      });

      // 2. Update employee record
      await tx.employees.update({
        where: { employee_id: id },
        data: {
          branch_id: dto.toBranchId,
          department_id: dto.toDepartmentId,
          post_id: dto.toPostId,
          current_base_salary: dto.toBaseSalary,
          employment_status: 'Transferred',
        },
      });

      return transfer;
    });
  }

  async getCategoryAllowancesAndDeductions(userId: number) {
    // Get user's employee profile
    const hrUser = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
      include: { employees: true }
    });

    if (!hrUser || !hrUser.employees) {
      throw new BadRequestException('Employee profile not found');
    }

    const employee = hrUser.employees;
    if (!employee.category_id) {
      return {
        categoryName: 'No Category Assigned',
        categoryCode: null,
        allowances: [],
        deductions: [],
        message: 'Employee has not been assigned to a salary category yet'
      };
    }

    // Fetch category details
    const category = await this.prisma.system_categories.findUnique({
      where: { category_id: employee.category_id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Fetch salary configuration for this category
    const salaryConfig = await this.prisma.salary_configurations.findUnique({
      where: { category_id: employee.category_id },
    });

    // Fetch category deductions
    const categoryDeductions = await this.prisma.category_deductions.findMany({
      where: { category_id: employee.category_id, is_enabled: true },
    });

    // Build allowances from salary configuration
    const allowances: Array<{ name: string; amount: number; type: string }> = [];
    if (salaryConfig) {
      if (Number(salaryConfig.basic_salary) > 0) {
        allowances.push({
          name: 'Basic Salary',
          amount: Number(salaryConfig.basic_salary),
          type: 'Fixed'
        });
      }
      if (Number(salaryConfig.transport_allowance || 0) > 0) {
        allowances.push({
          name: 'Transport Allowance',
          amount: Number(salaryConfig.transport_allowance),
          type: 'Fixed'
        });
      }
      if (Number(salaryConfig.housing_allowance || 0) > 0) {
        allowances.push({
          name: 'Housing Allowance',
          amount: Number(salaryConfig.housing_allowance),
          type: 'Fixed'
        });
      }
      if (Number(salaryConfig.meal_allowance || 0) > 0) {
        allowances.push({
          name: 'Meal Allowance',
          amount: Number(salaryConfig.meal_allowance),
          type: 'Fixed'
        });
      }
      if (Number(salaryConfig.performance_bonus || 0) > 0) {
        allowances.push({
          name: 'Performance Bonus',
          amount: Number(salaryConfig.performance_bonus),
          type: 'Fixed'
        });
      }
      if (Number(salaryConfig.project_bonus || 0) > 0) {
        allowances.push({
          name: 'Project Bonus',
          amount: Number(salaryConfig.project_bonus),
          type: 'Fixed'
        });
      }
    }

    // Build deductions from category deductions
    const deductions: Array<{ name: string; percentage: number; type: string; description: string }> = categoryDeductions.map(d => ({
      name: d.deduction_name,
      percentage: Number(d.percentage),
      type: 'Percentage',
      description: `${d.percentage}% of Gross Salary`
    }));

    return {
      categoryName: category.category_name,
      categoryCode: category.category_code,
      allowances,
      deductions,
      totalAllowances: allowances.reduce((sum, a) => sum + a.amount, 0),
      deductionPercentages: deductions.reduce((sum, d) => sum + d.percentage, 0)
    };
  }
}
