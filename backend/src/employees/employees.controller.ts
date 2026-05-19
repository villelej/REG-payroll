import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Post()
  @ApiOperation({ summary: 'Register a new employee (HR/Admin only)' })
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Req() req: RequestWithUser,
  ) {
    return this.employeesService.create(createEmployeeDto, req.user.role);
  }

  @Roles(hr_users_role.BranchHR, hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Get()
  @ApiOperation({ summary: 'Get all employees' })
  findAll(@Req() req: RequestWithUser) {
    // BranchHR can only see employees in their branch
    const branchId = req.user.role === hr_users_role.BranchHR ? req.user.branchId : undefined;
    return this.employeesService.findAll(req.user.companyId, branchId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current employee profile' })
  getProfile(@Req() req: RequestWithUser) {
    return this.employeesService.getProfile(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by id' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.employeesService.findOne(+id, req.user.companyId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(@Req() req: RequestWithUser, @Body() body: any) {
    return this.employeesService.updateProfile(req.user.userId, body);
  }

  @Get('me/salary-chart')
  @ApiOperation({ summary: 'Get monthly salary chart data' })
  getSalaryChart(@Req() req: RequestWithUser) {
    return this.employeesService.getSalaryChart(req.user.userId);
  }

  @Get('me/salary-breakdown')
  @ApiOperation({ summary: 'Get current salary breakdown for pie chart' })
  getSalaryBreakdown(@Req() req: RequestWithUser) {
    return this.employeesService.getSalaryBreakdown(req.user.userId);
  }

  @Get('me/category-details')
  @ApiOperation({ summary: 'Get category allowances and deductions' })
  getCategoryDetails(@Req() req: RequestWithUser) {
    return this.employeesService.getCategoryAllowancesAndDeductions(req.user.userId);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve or reject employee request (Super Admin only)',
  })
  approve(@Param('id') id: string, @Body() body: { status: string }) {
    return this.employeesService.approve(+id, body.status);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer employee to another branch/department' })
  transfer(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: RequestWithUser,
  ) {
    return this.employeesService.transfer(+id, {
      ...body,
      initiatedBy: req.user.userId,
      companyId: req.user.companyId,
    });
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Get('change-requests/pending')
  @ApiOperation({ summary: 'Get all pending profile change requests' })
  getChangeRequests(@Req() req: RequestWithUser) {
    return this.employeesService.getPendingChangeRequests(req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.CompanyAdmin)
  @Patch('change-requests/:id/review')
  @ApiOperation({ summary: 'Approve or reject a profile change request' })
  reviewChangeRequest(
    @Param('id') id: string,
    @Body() body: { status: 'Approved' | 'Rejected'; remarks: string },
    @Req() req: RequestWithUser,
  ) {
    return this.employeesService.reviewChangeRequest(
      +id,
      body.status,
      body.remarks,
      req.user.userId,
    );
  }
}
