import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(userId: number) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
    });
    if (!user || !user.employee_id) {
      throw new BadRequestException('User is not an employee or not found');
    }

    const employee = await this.prisma.employees.findUnique({
      where: { employee_id: user.employee_id },
    });
    if (!employee) throw new BadRequestException('Employee profile not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ findFirst instead of findUnique (no composite unique in schema)
    const existing = await this.prisma.attendance.findFirst({
      where: {
        employee_id: user.employee_id,
        attendance_date: today,
      },
    });

    if (existing) {
      throw new BadRequestException('Already checked in today');
    }

    return this.prisma.attendance.create({
      data: {
        employee_id: user.employee_id,
        company_id: employee.company_id,
        attendance_date: today,
        check_in_time: new Date(),
        status: 'Present',
      },
    });
  }

  async checkOut(userId: number) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
    });

    if (!user || !user.employee_id) {
      throw new BadRequestException('User not found or not an employee');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ findFirst instead of findUnique
    const record = await this.prisma.attendance.findFirst({
      where: {
        employee_id: user.employee_id,
        attendance_date: today,
      },
    });

    if (!record || !record.check_in_time) {
      throw new BadRequestException('No check-in record found for today');
    }

    if (record.check_out_time) {
      throw new BadRequestException('Already checked out today');
    }

    const checkOutTime = new Date();
    const diff = checkOutTime.getTime() - record.check_in_time.getTime();
    const hours = diff / (1000 * 60 * 60);

    return this.prisma.attendance.update({
      where: { attendance_id: record.attendance_id },
      data: {
        check_out_time: checkOutTime,
        working_hours: hours,
      },
    });
  }

  async getMyAttendance(userId: number) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
    });

    if (!user || !user.employee_id) return [];

    return this.prisma.attendance.findMany({
      where: { employee_id: user.employee_id },
      orderBy: { attendance_date: 'desc' },
    });
  }
}
