import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existing = await this.prisma.system_roles.findUnique({
      where: { role_name: createRoleDto.role_name },
    });

    if (existing) {
      throw new ConflictException('Role already exists');
    }

    return this.prisma.system_roles.create({
      data: {
        role_name: createRoleDto.role_name,
        status: createRoleDto.status || 'ACTIVE',
      },
    });
  }

  async findAll() {
    return this.prisma.system_roles.findMany();
  }

  async findOne(id: number) {
    const role = await this.prisma.system_roles.findUnique({
      where: { role_id: id },
    });
    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    if (updateRoleDto.role_name && updateRoleDto.role_name !== role.role_name) {
      const existing = await this.prisma.system_roles.findUnique({
        where: { role_name: updateRoleDto.role_name },
      });
      if (existing) {
        throw new ConflictException('Role already exists');
      }
    }

    return this.prisma.system_roles.update({
      where: { role_id: id },
      data: updateRoleDto,
    });
  }

  async remove(id: number) {
    return this.prisma.system_roles.delete({
      where: { role_id: id },
    });
  }
}
