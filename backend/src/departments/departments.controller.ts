import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.departmentsService.create(
      createDepartmentDto,
      req.user.companyId,
      req.user.role,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  findAll(@Req() req: RequestWithUser) {
    return this.departmentsService.findAll(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by id' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.departmentsService.findOne(+id, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update department' })
  update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Req() req: RequestWithUser,
  ) {
    return this.departmentsService.update(+id, updateDto, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve or reject department request (Super Admin only)',
  })
  approve(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: RequestWithUser,
  ) {
    return this.departmentsService.approve(
      +id,
      body.status,
      req.user.companyId,
    );
  }
}
