import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { BranchDeductionsService } from './branch-deductions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('branch-deductions')
@UseGuards(JwtAuthGuard)
export class BranchDeductionsController {
  constructor(private readonly deductionsService: BranchDeductionsService) {}

  @Get()
  async findAll(@Req() req) {
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'PlatformAdmin' && req.user.role !== 'Admin' && req.user.role !== 'CompanyAdmin') {
      throw new ForbiddenException('Only SuperAdmin can manage branch deductions');
    }
    return this.deductionsService.findAll(req.user.companyId);
  }

  @Post()
  async create(@Req() req, @Body() data) {
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'PlatformAdmin' && req.user.role !== 'Admin' && req.user.role !== 'CompanyAdmin') {
      throw new ForbiddenException('Only SuperAdmin can manage branch deductions');
    }
    return this.deductionsService.create(req.user.companyId, data);
  }

  @Put(':id')
  async update(@Req() req, @Param('id') id: string, @Body() data) {
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'PlatformAdmin' && req.user.role !== 'Admin' && req.user.role !== 'CompanyAdmin') {
      throw new ForbiddenException('Only SuperAdmin can manage branch deductions');
    }
    return this.deductionsService.update(req.user.companyId, Number(id), data);
  }

  @Put(':id/toggle')
  async toggleActive(@Req() req, @Param('id') id: string) {
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'PlatformAdmin' && req.user.role !== 'Admin' && req.user.role !== 'CompanyAdmin') {
      throw new ForbiddenException('Only SuperAdmin can manage branch deductions');
    }
    return this.deductionsService.toggleActive(req.user.companyId, Number(id));
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    if (req.user.role !== 'SuperAdmin' && req.user.role !== 'PlatformAdmin' && req.user.role !== 'Admin' && req.user.role !== 'CompanyAdmin') {
      throw new ForbiddenException('Only SuperAdmin can manage branch deductions');
    }
    return this.deductionsService.delete(req.user.companyId, Number(id));
  }
}
