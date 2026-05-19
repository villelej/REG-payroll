import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

let prismaInstance: PrismaClient;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  constructor() {
    if (!prismaInstance) {
      const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'payroll',
        connectionLimit: 5,
      };
      const adapter = new PrismaMariaDb(config);
      prismaInstance = new PrismaClient({
        adapter,
        log: ['warn', 'error'],
      });
    }
  }

  async onModuleInit() {
    // await prismaInstance.$connect();
  }

  async onModuleDestroy() {
    await prismaInstance.$disconnect();
  }

  get client() {
    return prismaInstance;
  }
  get employees() {
    return prismaInstance.employees;
  }
  get attendance() {
    return prismaInstance.attendance;
  }
  get companies() {
    return prismaInstance.companies;
  }
  get departments() {
    return prismaInstance.departments;
  }
  get branches() {
    return prismaInstance.branches;
  }
  get hr_users() {
    return prismaInstance.hr_users;
  }
  get employee_salary_components() {
    return prismaInstance.employee_salary_components;
  }
  get payroll_batches() {
    return prismaInstance.payroll_batches;
  }
  get payslips() {
    return prismaInstance.payslips;
  }
  get salary_grades() {
    return prismaInstance.salary_grades;
  }
  get salary_components() {
    return prismaInstance.salary_components;
  }
  get tax_deductions() {
    return prismaInstance.tax_deductions;
  }
  get employee_transfers() {
    return prismaInstance.employee_transfers;
  }
  get employee_leaves() {
    return prismaInstance.employee_leaves;
  }
  get leave_types() {
    return prismaInstance.leave_types;
  }
  get leave_balances() {
    return prismaInstance.leave_balances;
  }
  get holidays() {
    return prismaInstance.holidays;
  }
  get notifications() {
    return prismaInstance.notifications;
  }
  get documents() {
    return prismaInstance.documents;
  }
  get posts() {
    return prismaInstance.posts;
  }
  get regions() {
    return prismaInstance.regions;
  }
  get zones() {
    return prismaInstance.zones;
  }
  get employee_change_requests() {
    return prismaInstance.employee_change_requests;
  }
  get audit_log() {
    return prismaInstance.audit_log;
  }
  get system_categories() {
    return prismaInstance.system_categories;
  }
  get system_roles() {
    return prismaInstance.system_roles;
  }
  get salary_configurations() {
    return prismaInstance.salary_configurations;
  }
  get deduction_settings() {
    return prismaInstance.deduction_settings;
  }
  get category_deductions() {
    return prismaInstance.category_deductions;
  }
  get employee_payment_profiles() {
    return prismaInstance.employee_payment_profiles;
  }
  get payroll_records() {
    return prismaInstance.payroll_records;
  }
  get branch_deductions() {
    return prismaInstance.branch_deductions;
  }
  get codeSequences() {
    return prismaInstance.codeSequences;
  }


  async $transaction<T>(fn: (prisma: any) => Promise<T>): Promise<T> {
    return prismaInstance.$transaction(fn);
  }

  async $executeRawUnsafe(query: string, ...values: any[]) {
    return prismaInstance.$executeRawUnsafe(query, ...values);
  }

  async $queryRawUnsafe(query: string, ...values: any[]) {
    return prismaInstance.$queryRawUnsafe(query, ...values);
  }
}
