import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CodeGeneratorService } from '../common/services/code-generator.service';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService,
  ) { }

  async create(data: any, companyId: number, creatorRole: string) {
    this.logger.log(`Creating branch with data:`, { branch_code: data.branch_code, companyId });
    
    // Always generate branch_code if not provided or empty
    if (!data.branch_code || (typeof data.branch_code === 'string' && data.branch_code.trim() === '')) {
      this.logger.log(`Generating branch code for company ${companyId}`);
      data.branch_code = await this.codeGenerator.generateCode('BRANCH', companyId);
      this.logger.log(`Generated branch code: ${data.branch_code}`);
    } else {
      // Validate uniqueness if user provided a code
      const existing = await this.prisma.branches.findUnique({
        where: { branch_code: data.branch_code },
      });
      if (existing) {
        throw new ConflictException('Branch ID already exists');
      }
    }

    // Final validation before saving
    if (!data.branch_code || typeof data.branch_code !== 'string' || data.branch_code.trim() === '') {
      this.logger.error(`Invalid branch_code before save: ${data.branch_code}`);
      throw new ConflictException('Failed to generate branch code. Please try again.');
    }

    this.logger.log(`Saving branch with code: ${data.branch_code}`);

    const status = creatorRole === 'SuperAdmin' ? 'Approved' : 'Pending';
    return this.prisma.branches.create({
      data: { ...data, company_id: companyId, status },
    });
  }

  async findAll(companyId: number, role?: string) {
    if (role === 'SuperAdmin') {
      return this.prisma.branches.findMany();
    }
    return this.prisma.branches.findMany({
      where: { company_id: companyId },
    });
  }

  async findOne(id: number, companyId: number) {
    const branch = await this.prisma.branches.findUnique({
      where: { branch_id: id },
    });
    if (!branch || branch.company_id !== companyId) {
      throw new Error('Branch not found or access denied');
    }
    return branch;
  }

  async update(id: number, data: any, companyId: number) {
    await this.findOne(id, companyId);

    if (data.branch_code) {
      const existing = await this.prisma.branches.findUnique({
        where: { branch_code: data.branch_code },
      });
      if (existing && existing.branch_id !== id) {
        throw new ConflictException('Branch ID already exists');
      }
    }

    return this.prisma.branches.update({
      where: { branch_id: id },
      data,
    });
  }

  async approve(id: number, status: string, companyId: number) {
    await this.findOne(id, companyId);
    return this.prisma.branches.update({
      where: { branch_id: id },
      data: { status },
    });
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    try {
      return await this.prisma.branches.delete({
        where: { branch_id: id },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete this branch because it is still linked to employees, departments, users, or payroll records. Please reassign them or deactivate the branch instead.'
        );
      }
      throw error;
    }
  }
}
