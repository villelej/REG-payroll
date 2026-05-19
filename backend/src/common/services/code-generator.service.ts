import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CodeGeneratorService {
  private readonly logger = new Logger(CodeGeneratorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate auto-incremented codes with format: PREFIX-LETTER + incremental number
   * Examples: BR-A001, CT-A001, DP-A001, EM-A001, PS-A001, SC-A001
   */
  async generateCode(
    entityType: 'BRANCH' | 'CATEGORY' | 'DEPARTMENT' | 'EMPLOYEE' | 'POST' | 'SALARY_COMPONENT',
    companyId: number,
  ): Promise<string> {
    try {
      const prefixes = {
        BRANCH: 'BR',
        CATEGORY: 'CT',
        DEPARTMENT: 'DP',
        EMPLOYEE: 'EM',
        POST: 'PS',
        SALARY_COMPONENT: 'SC',
      };

      const prefix = prefixes[entityType];

      // Get or create sequence record
      let sequence = await this.prisma.codeSequences.findUnique({
        where: {
          company_id_entity_type: {
            company_id: companyId,
            entity_type: entityType,
          },
        },
      });

      if (!sequence) {
        sequence = await this.prisma.codeSequences.create({
          data: {
            company_id: companyId,
            entity_type: entityType,
            next_sequence: 1,
          },
        });
      }

      // Generate code with format: PREFIX-LETTER + 3-digit number
      const code = `${prefix}-A${String(sequence.next_sequence).padStart(3, '0')}`;

      // Increment sequence for next time
      await this.prisma.codeSequences.update({
        where: {
          company_id_entity_type: {
            company_id: companyId,
            entity_type: entityType,
          },
        },
        data: {
          next_sequence: sequence.next_sequence + 1,
        },
      });

      this.logger.log(`Generated code: ${code} for ${entityType} in company ${companyId}`);
      return code;
    } catch (error) {
      this.logger.error(`Failed to generate code for ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Get the next code without incrementing (for display purposes)
   */
  async getNextCode(
    entityType: 'BRANCH' | 'CATEGORY' | 'DEPARTMENT' | 'EMPLOYEE' | 'POST' | 'SALARY_COMPONENT',
    companyId: number,
  ): Promise<string> {
    const prefixes = {
      BRANCH: 'BR',
      CATEGORY: 'CT',
      DEPARTMENT: 'DP',
      EMPLOYEE: 'EM',
      POST: 'PS',
      SALARY_COMPONENT: 'SC',
    };

    const prefix = prefixes[entityType];

    const sequence = await this.prisma.codeSequences.findUnique({
      where: {
        company_id_entity_type: {
          company_id: companyId,
          entity_type: entityType,
        },
      },
    });

    const nextNum = sequence?.next_sequence ?? 1;
    return `${prefix}-A${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Reset sequence for an entity type (admin only)
   */
  async resetSequence(entityType: string, companyId: number): Promise<void> {
    await this.prisma.codeSequences.upsert({
      where: {
        company_id_entity_type: {
          company_id: companyId,
          entity_type: entityType,
        },
      },
      update: { next_sequence: 1 },
      create: {
        company_id: companyId,
        entity_type: entityType,
        next_sequence: 1,
      },
    });
  }
}
