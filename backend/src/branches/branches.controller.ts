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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR, hr_users_role.CompanyAdmin)
  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  create(
    @Body() createBranchDto: CreateBranchDto,
    @Req() req: RequestWithUser,
  ) {
    return this.branchesService.create(
      createBranchDto,
      req.user.companyId,
      req.user.role,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  findAll(@Req() req: RequestWithUser) {
    return this.branchesService.findAll(req.user.companyId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by id' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.branchesService.findOne(+id, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR, hr_users_role.CompanyAdmin)
  @Patch(':id')
  @ApiOperation({ summary: 'Update branch' })
  update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Req() req: RequestWithUser,
  ) {
    return this.branchesService.update(+id, updateDto, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve or reject branch request (Super Admin only)',
  })
  approve(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: RequestWithUser,
  ) {
    return this.branchesService.approve(+id, body.status, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Delete(':id')
  @ApiOperation({ summary: 'Hard delete a branch (Super Admin only)' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.branchesService.remove(+id, req.user.companyId);
  }
}
