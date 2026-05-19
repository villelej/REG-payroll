import { Controller, Get, Post, Body, UseGuards, Req, Query, Delete, Param } from '@nestjs/common';
import { SalarySettingsService } from './salary-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('salary-settings')
@UseGuards(JwtAuthGuard)
export class SalarySettingsController {
  constructor(private readonly service: SalarySettingsService) {}

  @Get('configurations')
  async getConfigurations(@Req() req) {
    return this.service.getConfigurations(req.user.companyId);
  }

  @Post('configurations')
  async upsertConfiguration(@Req() req, @Body() data) {
    return this.service.upsertConfiguration(req.user.companyId, data);
  }

  @Get('deductions')
  async getDeductions(@Req() req, @Query('categoryId') categoryId?: string) {
    return this.service.getDeductions(req.user.companyId, categoryId ? Number(categoryId) : undefined);
  }

  @Post('deductions')
  async updateDeductions(@Req() req, @Body() data) {
    return this.service.updateDeductions(req.user.companyId, data);
  }

  @Post('save-workflow')
  async saveWorkflow(@Req() req, @Body() data) {
    return this.service.saveWorkflow(req.user.companyId, data);
  }

  @Delete('configurations/:categoryId')
  async deleteConfiguration(@Req() req, @Param('categoryId') categoryId: string) {
    return this.service.deleteConfiguration(req.user.companyId, Number(categoryId));
  }
}
