import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, employee_leaves_status } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  // Leave Types
  async createLeaveType(data: Prisma.leave_typesCreateInput) {
    return this.prisma.leave_types.create({ data });
  }

  async findAllLeaveTypes(companyId: number) {
    return this.prisma.leave_types.findMany({
      where: { company_id: companyId, is_active: true },
    });
  }

  // Leave Applications
  async applyForLeave(employeeId: number, companyId: number, data: any) {
    // 1. Check if leave type exists
    const leaveType = await this.prisma.leave_types.findUnique({
      where: { leave_type_id: data.leaveTypeId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    // 2. Check balance (if not a simple application)
    const balance = await this.prisma.leave_balances.findFirst({
      where: {
        employee_id: employeeId,
        leave_type_id: data.leaveTypeId,
        financial_year: new Date().getFullYear().toString(),
      },
    });

    if (balance && Number(balance.closing_balance) < data.totalDays) {
      throw new BadRequestException('Insufficient leave balance');
    }

    // 3. Create leave request
    return this.prisma.employee_leaves.create({
      data: {
        employee_id: employeeId,
        company_id: companyId,
        leave_type_id: data.leaveTypeId,
        start_date: new Date(data.startDate),
        end_date: new Date(data.endDate),
        total_days: new Prisma.Decimal(data.totalDays),
        reason: data.reason,
        status: employee_leaves_status.Pending,
      },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.employee_leaves.findMany({
      where: { company_id: companyId },
      include: {
        employees: {
          select: { first_name: true, last_name: true, employee_code: true },
        },
        leave_types: true,
      },
    });
  }

  async findOwn(employeeId: number) {
    return this.prisma.employee_leaves.findMany({
      where: { employee_id: employeeId },
      include: { leave_types: true },
    });
  }

  async approveLeave(
    id: number,
    approvedBy: number,
    status: employee_leaves_status,
    remarks?: string,
  ) {
    const leave = await this.prisma.employee_leaves.findUnique({
      where: { leave_id: id },
    });

    if (!leave) throw new NotFoundException('Leave request not found');
    if (leave.status !== employee_leaves_status.Pending) {
      throw new BadRequestException(
        `Cannot update leave with status ${leave.status}`,
      );
    }

    const updatedLeave = await this.prisma.employee_leaves.update({
      where: { leave_id: id },
      data: {
        status,
        approved_by: approvedBy,
        approved_at: new Date(),
        rejection_reason:
          status === employee_leaves_status.Rejected ? remarks : null,
      },
    });

    // If approved, update balance
    if (status === employee_leaves_status.Approved) {
      const balance = await this.prisma.leave_balances.findFirst({
        where: {
          employee_id: leave.employee_id,
          leave_type_id: leave.leave_type_id,
        },
      });

      if (balance) {
        const usedDays = Number(balance.used_days) + Number(leave.total_days);
        const closingBalance =
          Number(balance.opening_balance) +
          Number(balance.accrued_days) -
          usedDays;

        await this.prisma.leave_balances.update({
          where: { balance_id: balance.balance_id },
          data: {
            used_days: new Prisma.Decimal(usedDays),
            closing_balance: new Prisma.Decimal(closingBalance),
            updated_at: new Date(),
          },
        });
      }
    }

    return updatedLeave;
  }

  async cancelLeave(id: number, employeeId: number) {
    const leave = await this.prisma.employee_leaves.findUnique({
      where: { leave_id: id },
    });

    if (!leave || leave.employee_id !== employeeId) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status !== employee_leaves_status.Pending) {
      throw new BadRequestException('Can only cancel pending leave requests');
    }

    return this.prisma.employee_leaves.update({
      where: { leave_id: id },
      data: { status: employee_leaves_status.Cancelled },
    });
  }

  async getBalance(employeeId: number) {
    return this.prisma.leave_balances.findMany({
      where: { employee_id: employeeId },
      include: { leave_types: true },
    });
  }
}
