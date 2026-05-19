import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role, employee_leaves_status } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('leaves')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Post('types')
  @ApiOperation({ summary: 'Create a new leave type (Admin/HR only)' })
  createType(@Body() data: any, @Req() req: RequestWithUser) {
    return this.leavesService.createLeaveType({
      ...data,
      company_id: req.user.companyId,
    });
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all leave types for the company' })
  findAllTypes(@Req() req: RequestWithUser) {
    return this.leavesService.findAllLeaveTypes(req.user.companyId);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply for leave (Employee)' })
  apply(@Req() req: RequestWithUser, @Body() data: any) {
    const employeeId = req.user.employeeId || req.user.userId;
    return this.leavesService.applyForLeave(
      employeeId,
      req.user.companyId,
      data,
    );
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Get()
  @ApiOperation({ summary: 'Get all leave requests (Admin/HR only)' })
  findAll(@Req() req: RequestWithUser) {
    return this.leavesService.findAll(req.user.companyId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own leave requests' })
  findOwn(@Req() req: RequestWithUser) {
    const employeeId = req.user.employeeId || req.user.userId;
    return this.leavesService.findOwn(employeeId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get own leave balance' })
  getBalance(@Req() req: RequestWithUser) {
    const employeeId = req.user.employeeId || req.user.userId;
    return this.leavesService.getBalance(employeeId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve or reject leave request' })
  approve(
    @Param('id') id: string,
    @Body() body: { status: employee_leaves_status; remarks?: string },
    @Req() req: RequestWithUser,
  ) {
    return this.leavesService.approveLeave(
      +id,
      req.user.userId,
      body.status,
      body.remarks,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel own leave request' })
  cancel(@Param('id') id: string, @Req() req: RequestWithUser) {
    const employeeId = req.user.employeeId || req.user.userId;
    return this.leavesService.cancelLeave(+id, employeeId);
  }
}
