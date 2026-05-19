import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Get('branches')
  @ApiOperation({ summary: 'Get branch distribution for pie chart' })
  getBranchDistribution(@Req() req: RequestWithUser) {
    return this.reportsService.getBranchDistribution(req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Get('salaries')
  @ApiOperation({ summary: 'Get annual salaries for bar graph' })
  getAnnualSalaries(@Req() req: RequestWithUser, @Query('year') year: string) {
    return this.reportsService.getAnnualSalaries(
      req.user.companyId,
      +year || new Date().getFullYear(),
    );
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get summary stats for Admin/HR dashboard' })
  getStats(@Req() req: RequestWithUser) {
    return this.reportsService.getStats(req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Get('dashboard/distribution')
  @ApiOperation({ summary: 'Get department distribution for pie chart' })
  getDistribution(@Req() req: RequestWithUser) {
    return this.reportsService.getDistribution(req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Get('dashboard/status-distribution')
  @ApiOperation({ summary: 'Get employment status distribution for pie chart' })
  getStatusDistribution(@Req() req: RequestWithUser) {
    return this.reportsService.getEmploymentStatusDistribution(
      req.user.companyId,
    );
  }

  @Get('dashboard/personal/salary-history')
  @ApiOperation({
    summary: 'Get personal salary history for bar chart (Employee only)',
  })
  getPersonalSalaryHistory(@Req() req: RequestWithUser) {
    if (!req.user.employeeId)
      throw new BadRequestException(
        'User is not associated with an employee profile',
      );
    return this.reportsService.getPersonalSalaryHistory(req.user.employeeId);
  }

  @Get('dashboard/personal/leave-balance')
  @ApiOperation({
    summary: 'Get personal leave balance for pie chart (Employee only)',
  })
  getPersonalLeaveBalance(@Req() req: RequestWithUser) {
    if (!req.user.employeeId)
      throw new BadRequestException(
        'User is not associated with an employee profile',
      );
    return this.reportsService.getPersonalLeaveBalance(req.user.employeeId);
  }
}
