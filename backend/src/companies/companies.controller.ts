import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by id' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(+id);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.companiesService.update(+id, updateDto);
  }
}
