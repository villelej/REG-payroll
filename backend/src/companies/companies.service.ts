import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    return this.prisma.companies.create({
      data: dto,
    });
  }

  async findAll() {
    try {
      console.log('=== findAll companies called ===');
      const result = await this.prisma.companies.findMany();
      console.log('=== Result:', result);
      return result;
    } catch (error) {
      console.log('=== ERROR:', error.message);
      console.log('=== FULL ERROR:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    return this.prisma.companies.findUnique({ where: { company_id: id } });
  }

  async update(id: number, dto: any) {
    return this.prisma.companies.update({
      where: { company_id: id },
      data: dto,
    });
  }
}
