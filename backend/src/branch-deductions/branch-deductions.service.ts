import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BranchDeductionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: number) {
    return this.prisma.branch_deductions.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' }
    });
  }

  async create(companyId: number, data: any) {
    return this.prisma.branch_deductions.create({
      data: {
        company_id: companyId,
        deduction_name: data.deduction_name,
        amount: data.amount,
        is_active: data.is_active ?? true,
        branch_ids: JSON.stringify(data.branch_ids || [])
      }
    });
  }

  async update(companyId: number, id: number, data: any) {
    const existing = await this.prisma.branch_deductions.findUnique({
      where: { id }
    });

    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundException('Deduction not found');
    }

    return this.prisma.branch_deductions.update({
      where: { id },
      data: {
        deduction_name: data.deduction_name,
        amount: data.amount,
        is_active: data.is_active,
        branch_ids: JSON.stringify(data.branch_ids || [])
      }
    });
  }

  async toggleActive(companyId: number, id: number) {
    const existing = await this.prisma.branch_deductions.findUnique({
      where: { id }
    });

    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundException('Deduction not found');
    }

    return this.prisma.branch_deductions.update({
      where: { id },
      data: {
        is_active: !existing.is_active
      }
    });
  }

  async delete(companyId: number, id: number) {
    const existing = await this.prisma.branch_deductions.findUnique({
      where: { id }
    });

    if (!existing || existing.company_id !== companyId) {
      throw new NotFoundException('Deduction not found');
    }

    return this.prisma.branch_deductions.delete({
      where: { id }
    });
  }
}
