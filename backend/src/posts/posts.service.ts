import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CodeGeneratorService } from '../common/services/code-generator.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService,
  ) {}

  async create(data: any, companyId: number) {
    // Always generate post_code if not provided or empty
    if (!data.post_code || (typeof data.post_code === 'string' && data.post_code.trim() === '')) {
      data.post_code = await this.codeGenerator.generateCode('POST', companyId);
    }

    // Final validation before saving
    if (!data.post_code || typeof data.post_code !== 'string' || data.post_code.trim() === '') {
      throw new Error('Failed to generate post code. Please try again.');
    }

    return this.prisma.posts.create({
      data: { ...data, company_id: companyId },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.posts.findMany({
      where: { company_id: companyId },
      include: {
        departments: true,
      },
    });
  }

  async findOne(id: number, companyId: number) {
    const post = await this.prisma.posts.findUnique({
      where: { post_id: id },
      include: {
        departments: true,
      },
    });
    if (!post || post.company_id !== companyId) {
      throw new NotFoundException(
        `Post with ID ${id} not found or access denied`,
      );
    }
    return post;
  }

  async update(id: number, data: any, companyId: number) {
    await this.findOne(id, companyId);
    return this.prisma.posts.update({
      where: { post_id: id },
      data,
    });
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    return this.prisma.posts.update({
      where: { post_id: id },
      data: { is_active: false },
    });
  }
}
