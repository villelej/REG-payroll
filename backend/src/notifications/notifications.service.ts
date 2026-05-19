import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findForUser(userId: number) {
    return this.prisma.notifications.findMany({
      where: { recipient_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notifications.update({
      where: { notification_id: id },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async create(data: any) {
    return this.prisma.notifications.create({
      data,
    });
  }

  async notifyUser(userId: number, companyId: number, title: string, message: string, type: any, actionUrl?: string) {
    return this.create({
      company_id: companyId,
      recipient_id: userId,
      recipient_type: 'USER',
      notification_type: type,
      title,
      message,
      action_url: actionUrl,
    });
  }

  async notifySuperAdmins(companyId: number, title: string, message: string, type: any, actionUrl?: string) {
    const superAdmins = await this.prisma.hr_users.findMany({
      where: {
        company_id: companyId,
        role: 'SuperAdmin'
      }
    });

    const notifications = superAdmins.map(admin => ({
      company_id: companyId,
      recipient_id: admin.user_id,
      recipient_type: 'ADMIN',
      notification_type: type,
      title,
      message,
      action_url: actionUrl,
    }));

    return this.prisma.notifications.createMany({
      data: notifications
    });
  }

  async notifyBranchHR(branchId: number, companyId: number, title: string, message: string, type: any, actionUrl?: string) {
    const hrAdmins = await this.prisma.hr_users.findMany({
      where: {
        branch_id: branchId,
        company_id: companyId,
        role: 'BranchHR'
      }
    });

    if (hrAdmins.length === 0) return;

    const notifications = hrAdmins.map(admin => ({
      company_id: companyId,
      branch_id: branchId,
      recipient_id: admin.user_id,
      recipient_type: 'ADMIN',
      notification_type: type,
      title,
      message,
      action_url: actionUrl,
    }));

    return this.prisma.notifications.createMany({
      data: notifications
    });
  }

  async notifyBatchEmployees(batchId: number, companyId: number, title: string, message: string, type: any, actionUrl?: string) {
    const payslips = await this.prisma.payslips.findMany({
      where: { batch_id: batchId },
      select: { employee_id: true }
    });

    if (payslips.length === 0) return;

    // Get the hr_users corresponding to these employees
    const users = await this.prisma.hr_users.findMany({
      where: { employee_id: { in: payslips.map(p => p.employee_id) } }
    });

    if (users.length === 0) return;

    const notifications = users.map(user => ({
      company_id: companyId,
      recipient_id: user.user_id,
      recipient_type: 'USER',
      notification_type: type,
      title,
      message,
      action_url: actionUrl,
    }));

    return this.prisma.notifications.createMany({
      data: notifications
    });
  }
}
