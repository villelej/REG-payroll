import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    companyId: number;
    branchId?: number;
    userId?: number;
    userType: string;
    action: string;
    entityType: string;
    entityId?: number;
    oldValues?: any;
    newValues?: any;
    remarks?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.audit_log.create({
      data: {
        company_id: data.companyId,
        branch_id: data.branchId,
        user_id: data.userId,
        user_type: data.userType,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        old_values: data.oldValues ? JSON.stringify(data.oldValues) : null,
        new_values: data.newValues ? JSON.stringify(data.newValues) : null,
        remarks: data.remarks,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
      },
    });
  }
}
