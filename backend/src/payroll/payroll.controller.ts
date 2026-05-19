import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { PayrollEligibleService } from './payroll-eligible.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly eligibleService: PayrollEligibleService
  ) {}

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Post('run')
  @ApiOperation({
    summary: 'Run payroll for a company for a specific period and frequency',
  })
  runPayroll(
    @Req() req: RequestWithUser,
    @Body()
    body: {
      companyId?: number;
      branchId?: number;
      employeeIds?: number[];
      month?: number;
      year?: number;
      frequency?: string;
      periodStart?: string;
    },
  ) {
    if (!req.user) throw new BadRequestException('User context missing');
    const companyId =
      req.user.role === hr_users_role.PlatformAdmin
        ? body.companyId || req.user.companyId
        : req.user.companyId;
    if (!companyId) throw new BadRequestException('Company ID is required');

    let frequency = (body.frequency || 'monthly').toLowerCase();
    let periodStart: Date;
    if (body.month && body.year) {
      periodStart = new Date(body.year, body.month - 1, 1);
      frequency = 'monthly';
    } else if (body.periodStart) {
      periodStart = new Date(body.periodStart);
    } else {
      // default to today as period start
      periodStart = new Date();
    }

    return this.payrollService.runPayroll(
      companyId,
      periodStart,
      frequency,
      req.user.userId,
      { 
        branchId: body.branchId || (req.user.role === hr_users_role.BranchHR ? req.user.branchId : undefined),
        employeeIds: body.employeeIds,
        distributionBank: (body as any).distributionBank,
        distributionAccount: (body as any).distributionAccount,
      }
    );
  }

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Post('eligible')
  @ApiOperation({ summary: 'Get employees eligible for payroll in a specific period' })
  getEligible(
    @Req() req: RequestWithUser,
    @Body() body: { month: number; year: number; branchId?: number }
  ) {
    const companyId = req.user.companyId;
    const branchId = body.branchId || (req.user.role === hr_users_role.BranchHR ? req.user.branchId : undefined);
    
    return this.eligibleService.getEligibleEmployees(
      companyId,
      branchId,
      Number(body.month || (new Date().getMonth() + 1)),
      Number(body.year || new Date().getFullYear())
    );
  }

  @Get('my-payslips')
  @ApiOperation({ summary: 'Get my own payslips (Employee only)' })
  getMyPayslips(@Req() req: RequestWithUser) {
    if (!req.user.employeeId) {
      throw new BadRequestException(
        'User is not associated with an employee profile',
      );
    }
    return this.payrollService.getPayslips(
      req.user.employeeId,
      req.user.companyId,
    );
  }

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Get('payslips/:employeeId')
  @ApiOperation({
    summary: 'Get payslips for a specific employee (HR/Admin only)',
  })
  getEmployeePayslips(@Req() req, @Param('employeeId') id: string) {
    return this.payrollService.getPayslips(+id, req.user.companyId);
  }

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Get('batches')
  @ApiOperation({ summary: 'Get all payroll batches (HR/Admin only)' })
  getBatches(@Req() req: RequestWithUser) {
    return this.payrollService.getBatches(req.user.companyId);
  }

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Get('records')
  @ApiOperation({ summary: 'Get all payment records (HR/Admin only)' })
  getAllRecords(@Req() req: RequestWithUser) {
    return this.payrollService.getPayrollRecords(req.user.companyId);
  }

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Get('payslips')
  @ApiOperation({ summary: 'Get all payslips for the company (HR/Admin only)' })
  getAllPayslips(@Req() req: RequestWithUser) {
    return this.payrollService.getAllPayslips(req.user.companyId);
  }

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Post('batches/:id/reset')
  @ApiOperation({ summary: 'Reset a payroll batch (Delete batch and payslips)' })
  async resetBatch(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.payrollService.deleteBatch(+id, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Patch('batches/:id/cancel')
  @ApiOperation({ summary: 'Cancel/Deny a payroll batch' })
  async cancelBatch(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.payrollService.cancelBatch(+id, req.user.companyId, req.user.userId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Patch('batches/:id/approve')
  @ApiOperation({ summary: 'Approve a payroll batch' })
  async approve(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.payrollService.approveBatch(+id, req.user.companyId, req.user.userId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Patch('batches/:id/pay')
  @ApiOperation({ summary: 'Mark a payroll batch as paid and notify employees' })
  async pay(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.payrollService.markAsPaid(+id, req.user.companyId, req.user.userId);
  }
}
