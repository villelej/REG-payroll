import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalaryComponentsService } from './salary-components.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('salary-components')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salary-components')
export class SalaryComponentsController {
  constructor(
    private readonly salaryComponentsService: SalaryComponentsService,
  ) {}

  @Roles(hr_users_role.SuperAdmin)
  @Post()
  @ApiOperation({ summary: 'Create a new salary component (Super Admin only)' })
  create(@Body() createComponentDto: any, @Req() req: RequestWithUser) {
    return this.salaryComponentsService.create({
      ...createComponentDto,
      company_id: req.user.companyId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all salary components' })
  findAll(@Req() req: RequestWithUser) {
    return this.salaryComponentsService.findAll(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get salary component by id' })
  findOne(@Param('id') id: string) {
    return this.salaryComponentsService.findOne(+id);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a salary component' })
  update(@Param('id') id: string, @Body() updateComponentDto: any) {
    return this.salaryComponentsService.update(+id, updateComponentDto);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a salary component' })
  remove(@Param('id') id: string) {
    return this.salaryComponentsService.remove(+id);
  }
}
