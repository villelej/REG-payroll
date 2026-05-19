import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CodeGeneratorService } from '../common/services/code-generator.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalaryComponentsService {
  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService,
  ) {}

  async create(data: Prisma.salary_componentsCreateInput) {
    if (!data.component_code || (typeof data.component_code === 'string' && data.component_code.trim() === '')) {
      const companyId = (data.company_id as number) || 0;
      data.component_code = await this.codeGenerator.generateCode('SALARY_COMPONENT', companyId);
    }

    // Final validation before saving
    if (!data.component_code || typeof data.component_code !== 'string' || data.component_code.trim() === '') {
      throw new Error('Failed to generate salary component code. Please try again.');
    }

    return this.prisma.salary_components.create({
      data,
    });
  }

  async findAll(companyId?: number) {
    return this.prisma.salary_components.findMany({
      where: companyId ? { company_id: companyId } : {},
      orderBy: { display_order: 'asc' },
    });
  }

  async findOne(id: number) {
    const component = await this.prisma.salary_components.findUnique({
      where: { component_id: id },
    });
    if (!component)
      throw new NotFoundException(`Salary component with ID ${id} not found`);
    return component;
  }

  async update(id: number, data: Prisma.salary_componentsUpdateInput) {
    return this.prisma.salary_components.update({
      where: { component_id: id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.salary_components.update({
      where: { component_id: id },
      data: { is_active: false },
    });
  }
}
