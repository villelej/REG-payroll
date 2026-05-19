import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hr_users_role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import * as nodemailer from 'nodemailer';
import { generateNextCode } from '../utils/code-generator';

type SafeUser = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: hr_users_role;
  company_id: number | null;
  employee_id: number | null;
  branch_id: number | null;
  is_active: boolean;
  is_locked: boolean;
  created_at: Date;
  updated_at: Date;
  profile: Record<string, unknown>;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private async sendStatusEmail(to: string, status: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user || 'no-reply@reserve.local';

    if (!host || !user || !pass) {
      console.warn(`SMTP not configured. Status email for ${to} (${status}) skipped.`);
      return;
    }

    let messageBody = '';
    if (status === 'LOCKED') {
      messageBody = 'Your account has been temporarily locked. Please contact HR or Admin for assistance.';
    } else if (status === 'BLOCKED') {
      messageBody = 'Your account has been blocked. Please contact HR or Admin for more information.';
    } else if (status === 'ACTIVE') {
      messageBody = 'Your account has been reactivated. You can now log in.';
    } else {
      return; // Skip sending email for other statuses like PENDING
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to,
        subject: 'Account Status Update',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Hello,</p>
            <p>${messageBody}</p>
            <p>Regards,<br/>Reserve Force Payroll System</p>
          </div>
        `,
      });
    } catch (e) {
      console.error('Failed to send status email:', e);
    }
  }

  private toRole(input: CreateUserDto['role']): hr_users_role {
    if (input === 'SuperAdmin') return hr_users_role.SuperAdmin;
    if (input === 'BranchHR') return hr_users_role.BranchHR;
    return hr_users_role.Employee;
  }

  private toStatusFlags(status: string): { is_active: boolean; is_locked: boolean } {
    if (status === 'LOCKED') return { is_active: true, is_locked: true };
    if (status === 'BLOCKED') return { is_active: false, is_locked: false };
    if (status === 'PENDING') return { is_active: false, is_locked: false };
    return { is_active: true, is_locked: false };
  }

  private parseProfile(permissions?: string | null): Record<string, unknown> {
    if (!permissions) return {};
    try {
      const parsed = JSON.parse(permissions);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  private sanitizeUser(user: any): SafeUser {
    const { password_hash, refresh_token_hash, activation_token, employees, ...rest } = user;
    
    // If employees relation exists, pull data from it
    let category_id = user.category_id;
    if (employees && employees.length > 0) {
      category_id = employees[0].category_id;
    }

    return {
      ...rest,
      category_id,
      profile: this.parseProfile(user.permissions),
    };
  }

  private ensureCanReadTarget(actor: any, target: any): void {
    if (actor.role === hr_users_role.SuperAdmin) return;
    if (actor.role === hr_users_role.BranchHR || actor.role === hr_users_role.CompanyAdmin) {
      if (target.role === hr_users_role.SuperAdmin) {
        throw new ForbiddenException('Admin cannot access SuperAdmin records');
      }
      return;
    }
    if (actor.userId !== target.user_id) {
      throw new ForbiddenException('User can only access own profile');
    }
  }

  async findAll(actor: any, query: Record<string, string>) {
    const where: any = {};
    
    // Role-based visibility
    if (actor.role === hr_users_role.BranchHR || actor.role === hr_users_role.CompanyAdmin) {
      // Admins see all Employees in their company
      where.role = hr_users_role.Employee;
      if (actor.companyId) {
        where.company_id = actor.companyId;
      }
      
      // BranchHR can only see employees in their branch
      if (actor.role === hr_users_role.BranchHR && actor.branchId) {
        where.branch_id = actor.branchId;
      }
    } else if (actor.role === hr_users_role.SuperAdmin) {
      // SuperAdmin sees everyone, no initial filters
    } else {
      // Employees only see themselves
      where.user_id = actor.userId;
    }

    const search = (query.q || '').trim();
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { full_name: { contains: search } },
            { email: { contains: search } },
            { username: { contains: search } },
          ]
        }
      ];
    }

    if (query.role) {
      let r = query.role;
      if (r === 'User' || r === 'user' || r === 'users') r = 'Employee';
      if (r === 'Admin' || r === 'admin') r = 'CompanyAdmin';
      where.role = r as hr_users_role;
    }



    const users = await this.prisma.hr_users.findMany({
      where,
      include: {
        employees: true
      },
      orderBy: { created_at: 'desc' },
    });
    return users.map((u) => this.sanitizeUser(u));
  }

  async findOne(actor: any, id: number) {
    const user = await this.prisma.hr_users.findUnique({ 
      where: { user_id: id },
      include: { employees: true }
    });
    if (!user) throw new NotFoundException('User not found');
    this.ensureCanReadTarget(actor, user);
    return this.sanitizeUser(user);
  }

  async create(actor: any, dto: CreateUserDto) {
    const requestedRole = this.toRole(dto.role);

    if (actor.role === hr_users_role.BranchHR || actor.role === hr_users_role.CompanyAdmin) {
      if (requestedRole !== hr_users_role.Employee) {
        throw new ForbiddenException('Admin can only create users with the role of Employee');
      }
    } else if (actor.role !== hr_users_role.SuperAdmin) {
      throw new ForbiddenException('You do not have permission to create users');
    }
    const requestedEmail = dto.email.trim().toLowerCase();
    
    let requestedUsername = (dto.username || '').trim();
    if (!requestedUsername && requestedRole === hr_users_role.Employee) {
      const lastEmployee = await this.prisma.employees.findFirst({
        orderBy: { employee_id: 'desc' },
      });
      requestedUsername = generateNextCode('EMP', lastEmployee?.employee_code);
    } else if (!requestedUsername) {
      requestedUsername = requestedEmail.split('@')[0];
    }

    const conflicts = await this.prisma.hr_users.findMany({
      where: {
        OR: [
          { email: requestedEmail },
          ...(dto.national_id ? [{ national_id: dto.national_id }] : []),
          ...(dto.phone_number ? [{ phone_number: dto.phone_number }] : []),
          { username: requestedUsername },
          ...(dto.payment_number ? [{ payment_number: dto.payment_number }] : [])
        ]
      }
    });

    if (conflicts.length > 0) {
      const errors: string[] = [];
      conflicts.forEach(c => {
        if (c.email === requestedEmail) errors.push("Email already exists.");
        if (dto.national_id && c.national_id === dto.national_id) errors.push("National ID already exists.");
        if (dto.phone_number && c.phone_number === dto.phone_number) errors.push("Telephone Number already exists.");
        if (c.username === requestedUsername) errors.push("Username already exists.");
        if (dto.payment_number && c.payment_number === dto.payment_number) errors.push("Payment Number already exists.");
      });
      if (errors.length > 0) {
        throw new BadRequestException(Array.from(new Set(errors)));
      }
    }

    const flags = this.toStatusFlags(dto.status);
    const password = dto.password || 'Reg@12345';
    const password_hash = await bcrypt.hash(password, 10);
    const profile = {
      national_id: dto.national_id,
      phone_number: dto.phone_number,
      date_of_birth: dto.date_of_birth || null,
      branch: dto.branch || null,
      category: dto.category || null,
      contract_type: dto.contract_type || null,
      education_level: dto.education_level || null,
      payment_method: dto.payment_method || null,
      payment_number: dto.payment_number || null,
      status: dto.status,
    };

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.hr_users.create({
        data: {
          email: requestedEmail,
          username: requestedUsername,
          full_name: dto.full_name.trim(),
          role: requestedRole,
          password_hash,
          company_id: actor.companyId || null,
          created_by: actor.role === hr_users_role.SuperAdmin ? actor.userId : null,
          branch_id: null,
          is_active: flags.is_active,
          is_locked: flags.is_locked,
          permissions: JSON.stringify(profile),
          national_id: dto.national_id || null,
          phone_number: dto.phone_number || null,
          date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
          category: dto.category || null,
          contract_type: dto.contract_type || null,
          education_level: dto.education_level || null,
          contract_start: dto.contract_start ? new Date(dto.contract_start) : null,
          contract_end: dto.contract_end ? new Date(dto.contract_end) : null,
          payment_method: dto.payment_method || null,
          payment_number: dto.payment_number || null,
        },
      });

      // Log user creation in audit_log (especially important for SuperAdmin creations)
      if (requestedRole === hr_users_role.SuperAdmin || requestedRole === hr_users_role.BranchHR) {
        await tx.audit_log.create({
          data: {
            company_id: actor.companyId || 1,
            user_id: actor.userId,
            user_type: actor.role,
            action: 'CREATE_USER',
            entity_type: requestedRole === hr_users_role.SuperAdmin ? 'SUPER_ADMIN' : 'BRANCH_HR',
            entity_id: user.user_id,
            new_values: JSON.stringify({
              user_id: user.user_id,
              email: user.email,
              username: user.username,
              full_name: user.full_name,
              role: user.role,
              status: flags.is_active ? 'ACTIVE' : 'BLOCKED',
              created_at: user.created_at,
            }),
            remarks: `${actor.role} created new ${requestedRole === hr_users_role.SuperAdmin ? 'SuperAdmin' : 'BranchHR'} user`
          }
        });
      }

      if (requestedRole === hr_users_role.Employee) {
        // Find category_id from category name
        let categoryId: number | null = null;
        if (dto.category) {
          const sysCat = await tx.system_categories.findFirst({
            where: { category_name: dto.category }
          });
          categoryId = sysCat ? sysCat.category_id : null;
        }

        // Find branch_id from branch name
        let branchId: number | null = null;
        if (dto.branch) {
          const sysBranch = await tx.branches.findFirst({
            where: { branch_name: dto.branch, company_id: actor.companyId }
          });
          branchId = sysBranch ? sysBranch.branch_id : null;
        }

        // Find fallback IDs if needed
        let firstDept = await tx.departments.findFirst({ where: { company_id: actor.companyId } });
        if (!firstDept) {
          firstDept = await tx.departments.create({
            data: { department_name: 'General', department_code: 'GEN', company_id: actor.companyId, status: 'Active' }
          });
        }

        let firstPost = await tx.posts.findFirst({ where: { company_id: actor.companyId } });
        if (!firstPost) {
          firstPost = await tx.posts.create({
            data: { post_title: 'General Staff', post_code: 'GEN', department_id: firstDept.department_id, company_id: actor.companyId, base_salary: 0 }
          });
        }

        let fallbackBranch = await tx.branches.findFirst({ where: { company_id: actor.companyId } });
        if (!fallbackBranch && !branchId) {
          fallbackBranch = await tx.branches.create({
            data: { branch_name: 'Main Branch', branch_code: 'MAIN', status: 'Approved', company_id: actor.companyId }
          });
        }

        // Create detailed Employee record
        const employee = await tx.employees.create({
          data: {
            company_id: actor.companyId,
            branch_id: branchId || (fallbackBranch ? fallbackBranch.branch_id : 1),
            employee_code: requestedUsername,
            first_name: dto.full_name.split(' ')[0],
            last_name: dto.full_name.split(' ').slice(1).join(' ') || '.',
            date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : new Date(),
            gender: 'Other',
            personal_email: requestedEmail,
            phone_number: dto.phone_number || '',
            department_id: firstDept ? firstDept.department_id : 1,
            post_id: firstPost ? firstPost.post_id : 1,
            category_id: categoryId,
            date_of_joining: dto.contract_start ? new Date(dto.contract_start) : new Date(),
            current_base_salary: 0,
            bank_account_holder: dto.full_name,
            bank_name: 'Default',
            bank_account_number: dto.payment_number || '',
            bank_ifsc_code: '0',
            national_id: dto.national_id,
            education_level: dto.education_level,
          }
        });

        // Link HR User to Employee
        await tx.hr_users.update({
          where: { user_id: user.user_id },
          data: { employee_id: employee.employee_id }
        });

        // Create Payment Profile
        await tx.employee_payment_profiles.create({
          data: {
            employee_id: employee.employee_id,
            payment_method: dto.payment_method || 'Bank',
            account_number: dto.payment_method === 'Bank' ? dto.payment_number : null,
            phone_number: dto.payment_method === 'MoMo' ? dto.payment_number : null,
          }
        });

        // Create initial Payroll Record
        if (categoryId) {
          const config = await tx.salary_configurations.findUnique({
            where: { category_id: categoryId }
          });
          if (config) {
            const g = config.gross_salary ? Number(config.gross_salary) : 0;
            const n = config.net_salary ? Number(config.net_salary) : 0;
            
            await tx.payroll_records.create({
              data: {
                employee_id: employee.employee_id,
                category_id: categoryId,
                gross_salary: g,
                total_deductions: Math.max(0, g - n),
                net_salary: n,
                payment_status: 'Pending',
              }
            });
          }
        }

        // Initialize other related records (Leave Balances, Tax Profile)
        await this.initializeEmployeeRelatedRecords(tx, employee.employee_id, actor.companyId);
      }
      return user;
    });
    return this.sanitizeUser(created);
  }

  async update(actor: any, id: number, dto: UpdateUserDto) {
    const existing = await this.prisma.hr_users.findUnique({ where: { user_id: id } });
    if (!existing) throw new NotFoundException('User not found');

    if (actor.role === hr_users_role.Employee && actor.userId !== id) {
      throw new ForbiddenException('User can only update own profile');
    }
    if ((actor.role === hr_users_role.BranchHR || actor.role === hr_users_role.CompanyAdmin) && existing.role !== hr_users_role.Employee) {
      throw new ForbiddenException('Admin can only edit users');
    }

    const requestedEmail = dto.email !== undefined ? dto.email.trim().toLowerCase() : existing.email;
    const requestedUsername = dto.username !== undefined ? dto.username : existing.username;

    const conflicts = await this.prisma.hr_users.findMany({
      where: {
        user_id: { not: id },
        OR: [
          { email: requestedEmail },
          ...(dto.national_id ? [{ national_id: dto.national_id }] : []),
          ...(dto.phone_number ? [{ phone_number: dto.phone_number }] : []),
          { username: requestedUsername },
          ...(dto.payment_number ? [{ payment_number: dto.payment_number }] : [])
        ]
      }
    });

    if (conflicts.length > 0) {
      const errors: string[] = [];
      conflicts.forEach(c => {
        if (c.email === requestedEmail) errors.push("Email already exists.");
        if (dto.national_id && c.national_id === dto.national_id) errors.push("National ID already exists.");
        if (dto.phone_number && c.phone_number === dto.phone_number) errors.push("Telephone Number already exists.");
        if (c.username === requestedUsername) errors.push("Username already exists.");
        if (dto.payment_number && c.payment_number === dto.payment_number) errors.push("Payment Number already exists.");
      });
      if (errors.length > 0) {
        throw new BadRequestException(Array.from(new Set(errors)));
      }
    }

    // Strip unallowed fields for Employees
    if (actor.role === hr_users_role.Employee) {
      const allowedFields = ['full_name', 'national_id', 'phone_number', 'education_level', 'payment_number'];
      Object.keys(dto).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete (dto as any)[key];
        }
      });
    }

    const currentProfile = this.parseProfile(existing.permissions);
    const nextProfile = {
      ...currentProfile,
      ...(dto.national_id !== undefined ? { national_id: dto.national_id } : {}),
      ...(dto.phone_number !== undefined ? { phone_number: dto.phone_number } : {}),
      ...(dto.date_of_birth !== undefined ? { date_of_birth: dto.date_of_birth } : {}),
      ...(dto.branch !== undefined ? { branch: dto.branch } : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.contract_type !== undefined ? { contract_type: dto.contract_type } : {}),
      ...(dto.education_level !== undefined ? { education_level: dto.education_level } : {}),
      ...(dto.payment_method !== undefined ? { payment_method: dto.payment_method } : {}),
      ...(dto.payment_number !== undefined ? { payment_number: dto.payment_number } : {}),
    };

    const roleUpdate =
      actor.role === hr_users_role.SuperAdmin && dto.role
        ? { role: this.toRole(dto.role) }
        : {};

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.hr_users.update({
        where: { user_id: id },
        data: {
          ...(dto.full_name !== undefined ? { full_name: dto.full_name } : {}),
          ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() } : {}),
          ...(dto.username !== undefined ? { username: dto.username } : {}),
          ...(dto.national_id !== undefined ? { national_id: dto.national_id } : {}),
          ...(dto.phone_number !== undefined ? { phone_number: dto.phone_number } : {}),
          ...(dto.contract_type !== undefined ? { contract_type: dto.contract_type } : {}),
          ...(dto.contract_start !== undefined ? { contract_start: (dto.contract_start && !isNaN(new Date(dto.contract_start).getTime())) ? new Date(dto.contract_start) : null } : {}),
          ...(dto.contract_end !== undefined ? { contract_end: (dto.contract_end && !isNaN(new Date(dto.contract_end).getTime())) ? new Date(dto.contract_end) : null } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.payment_method !== undefined ? { payment_method: dto.payment_method } : {}),
          ...(dto.payment_number !== undefined ? { payment_number: dto.payment_number } : {}),
          ...roleUpdate,
          permissions: JSON.stringify(nextProfile),
        },
      });

      if (user.role === hr_users_role.Employee) {
        let employeeId = user.employee_id;

        try {
          // If employee record is missing, create it
          if (!employeeId) {
            const companyId = user.company_id || actor.companyId || 1;
            let firstBranch = await tx.branches.findFirst({ where: { company_id: companyId } });
            let firstDept = await tx.departments.findFirst({ where: { company_id: companyId } });
            let firstPost: any = null;

            // Auto-create branch if none exists
            if (!firstBranch) {
              firstBranch = await tx.branches.create({
                data: {
                  company_id: companyId,
                  branch_code: 'HQ',
                  branch_name: 'Head Office',
                  address_line1: 'Kigali',
                  city: 'Kigali',
                }
              });
            }

            // Auto-create department if none exists
            if (!firstDept) {
              firstDept = await tx.departments.create({
                data: {
                  company_id: companyId,
                  branch_id: firstBranch.branch_id,
                  department_code: 'GEN',
                  department_name: 'General',
                }
              });
            }

            // Find or create post
            firstPost = await tx.posts.findFirst({ where: { company_id: companyId } });
            if (!firstPost) {
              firstPost = await tx.posts.create({
                data: {
                  company_id: companyId,
                  department_id: firstDept.department_id,
                  post_code: 'STF',
                  post_title: 'Staff',
                  base_salary: 0,
                }
              });
            }

            const employee = await tx.employees.create({
              data: {
                company_id: companyId,
                branch_id: user.branch_id || firstBranch.branch_id,
                employee_code: user.username || `EMP-${id}`,
                full_name: user.full_name || user.username || 'Unknown',
                first_name: (user.full_name || user.username || 'Unknown').split(' ')[0],
                last_name: (user.full_name || user.username || 'Unknown').split(' ').slice(1).join(' ') || '.',
                date_of_birth: user.date_of_birth || new Date('2000-01-01'),
                gender: 'Other',
                personal_email: user.email,
                phone_number: user.phone_number || '0000000000',
                department_id: firstDept.department_id,
                post_id: firstPost.post_id,
                category_id: null,
                date_of_joining: new Date(),
                current_base_salary: 0,
                bank_account_holder: user.full_name || user.username || 'Unknown',
                bank_name: 'Default',
                bank_account_number: user.payment_number || '0',
                bank_ifsc_code: '0',
                national_id: user.national_id || '',
              }
            });
            employeeId = employee.employee_id;
            
            await tx.hr_users.update({
              where: { user_id: id },
              data: { employee_id: employeeId }
            });
            console.log(`Created employee record ${employeeId} for user ${id}`);
          }

          // Update Employee record
          let categoryId: number | undefined = undefined;
          if (dto.category) {
            const sysCat = await tx.system_categories.findFirst({
              where: { category_name: dto.category }
            });
            if (sysCat) categoryId = sysCat.category_id;
          }

          await tx.employees.update({
            where: { employee_id: employeeId },
            data: {
              ...(dto.full_name !== undefined ? { 
                full_name: dto.full_name,
                first_name: dto.full_name.split(' ')[0],
                last_name: dto.full_name.split(' ').slice(1).join(' ') || '.'
              } : {}),
              ...(dto.phone_number !== undefined ? { phone_number: dto.phone_number } : {}),
              ...(dto.national_id !== undefined ? { national_id: dto.national_id } : {}),
              ...(dto.education_level !== undefined ? { education_level: dto.education_level } : {}),
              ...(categoryId !== undefined ? { system_categories: { connect: { category_id: categoryId } } } : {}),
              ...(dto.payment_number !== undefined ? { bank_account_number: dto.payment_number } : {}),
            }
          });

          // Update Payment Profile
          if (employeeId && (dto.payment_method !== undefined || dto.payment_number !== undefined)) {
            await tx.employee_payment_profiles.upsert({
              where: { employee_id: employeeId },
              update: {
                ...(dto.payment_method !== undefined ? { payment_method: dto.payment_method } : {}),
                ...(dto.payment_number !== undefined ? {
                  account_number: (dto.payment_method || user.payment_method) === 'Bank' ? dto.payment_number : null,
                  phone_number: (dto.payment_method || user.payment_method) === 'MoMo' ? dto.payment_number : null,
                } : {}),
              },
              create: {
                employee_id: employeeId,
                payment_method: dto.payment_method || 'Bank account',
                account_number: dto.payment_method === 'Bank account' ? dto.payment_number : null,
                phone_number: dto.payment_method === 'Telephone' ? dto.payment_number : null,
              }
            });
          }

          // Sync Payroll Record if category changed
          if (categoryId && employeeId) {
            const config = await tx.salary_configurations.findUnique({
              where: { category_id: categoryId }
            });
            if (config) {
              await tx.payroll_records.upsert({
                where: { employee_id: employeeId },
                update: {
                  category_id: categoryId,
                  gross_salary: config.gross_salary || 0,
                  total_deductions: (config.gross_salary && config.net_salary) ? (config.gross_salary.toNumber() - config.net_salary.toNumber()) : 0,
                  net_salary: config.net_salary || 0,
                },
                create: {
                  employee_id: employeeId,
                  category_id: categoryId,
                  gross_salary: config.gross_salary || 0,
                  total_deductions: (config.gross_salary && config.net_salary) ? (config.gross_salary.toNumber() - config.net_salary.toNumber()) : 0,
                  net_salary: config.net_salary || 0,
                  payment_status: 'Pending',
                }
              });
            }
          }

          // Initialize other related records (Leave Balances, Tax Profile)
          await this.initializeEmployeeRelatedRecords(tx, employeeId, user.company_id || actor.companyId || 1);
        } catch (empError) {
          console.error('Error updating employee record for user', id, ':', empError);
          throw empError;
        }
      }

      return user;
    });
    return this.sanitizeUser(updated);
  }

  private async initializeEmployeeRelatedRecords(tx: any, employeeId: number, companyId: number) {
    try {
      // 1. Initialize Leave Balances
      const leaveTypes = await tx.leave_types.findMany({
        where: { is_active: true }
      });

      for (const type of leaveTypes) {
        // Since there's no unique constraint on employee_id+leave_type_id in schema, 
        // we check existence manually to avoid duplicates
        const existing = await tx.leave_balances.findFirst({
          where: { employee_id: employeeId, leave_type_id: type.leave_type_id }
        });

        if (!existing) {
          await tx.leave_balances.create({
            data: {
              employee_id: employeeId,
              leave_type_id: type.leave_type_id,
              company_id: companyId,
              financial_year: new Date().getFullYear().toString(),
              opening_balance: type.default_days_per_year || 0,
              accrued_days: 0,
              used_days: 0,
              closing_balance: type.default_days_per_year || 0,
              updated_at: new Date()
            }
          });
        }
      }

      // 2. Initialize Tax Deduction Profile
      const existingTax = await tx.tax_deductions.findFirst({
        where: { employee_id: employeeId }
      });

      if (!existingTax) {
        await tx.tax_deductions.create({
          data: {
            employee_id: employeeId,
            company_id: companyId,
            financial_year: new Date().getFullYear().toString(),
            estimated_annual_income: 0,
            total_exemptions: 0,
            total_deductions_80c: 0,
            total_deductions_80d: 0,
            other_deductions: 0,
            taxable_income: 0,
            tax_liability: 0,
            tds_deducted_so_far: 0,
            tds_per_month: 0,
            updated_at: new Date()
          }
        });
      }

      console.log(`Initialized related records for employee ${employeeId}`);
    } catch (err) {
      console.error(`Failed to initialize related records for employee ${employeeId}:`, err);
    }
  }

  async remove(actor: any, id: number) {
    if (actor.role !== hr_users_role.SuperAdmin) {
      throw new ForbiddenException('Only SuperAdmin can delete users');
    }
    await this.prisma.hr_users.delete({ where: { user_id: id } });
    return { message: 'User deleted successfully' };
  }

  async updateStatus(actor: any, dto: UpdateUserStatusDto) {
    const target = await this.prisma.hr_users.findUnique({
      where: { user_id: dto.userId },
    });
    if (!target) throw new NotFoundException('User not found');

    const profile = this.parseProfile(target.permissions);

    if (actor.role === hr_users_role.BranchHR || actor.role === hr_users_role.CompanyAdmin) {
      if (target.role !== hr_users_role.Employee) {
        throw new ForbiddenException('Admin can only request status updates for users');
      }
      if (dto.status !== 'PENDING') {
        throw new ForbiddenException(
          'Admin status changes require SuperAdmin approval and must be set to PENDING',
        );
      }
      
      const requestedStatus = dto.reason?.split('to ')[1] || 'LOCKED';
      const nextProfile = {
        ...profile,
        status_request: requestedStatus,
        status_reason: dto.reason || null,
      };

      const updated = await this.prisma.hr_users.update({
        where: { user_id: dto.userId },
        data: {
          permissions: JSON.stringify(nextProfile),
        },
      });
      return this.sanitizeUser(updated);

    } else if (actor.role === hr_users_role.SuperAdmin) {
      // If we are passing "APPROVE_PENDING", use the stored request
      let targetStatus = dto.status;
      if (dto.status === 'APPROVE_PENDING') {
        targetStatus = (profile as any).status_request;
        if (!targetStatus) throw new BadRequestException('No pending status to approve');
      } else if (dto.status === 'REJECT_PENDING') {
        // Just clear the request
        const nextProfile = { ...profile };
        delete (nextProfile as any).status_request;
        delete (nextProfile as any).status_reason;
        
        const updated = await this.prisma.hr_users.update({
          where: { user_id: dto.userId },
          data: {
            permissions: JSON.stringify(nextProfile),
          },
        });
        return this.sanitizeUser(updated);
      }

      const flags = this.toStatusFlags(targetStatus);
      const nextProfile = {
        ...profile,
        status: targetStatus,
      };
      delete (nextProfile as any).status_request;
      delete (nextProfile as any).status_reason;

      // Type-cast for account_status
      const accountStatusMap: Record<string, 'ACTIVE' | 'LOCKED' | 'BLOCKED'> = {
        'ACTIVE': 'ACTIVE',
        'LOCKED': 'LOCKED',
        'BLOCKED': 'BLOCKED',
      };

      const updated = await this.prisma.hr_users.update({
        where: { user_id: dto.userId },
        data: {
          is_active: flags.is_active,
          is_locked: flags.is_locked,
          account_status: accountStatusMap[targetStatus] || 'ACTIVE',
          permissions: JSON.stringify(nextProfile),
        },
      });
      
      // Send notification email
      if (['ACTIVE', 'LOCKED', 'BLOCKED'].includes(targetStatus)) {
        this.sendStatusEmail(target.email, targetStatus);
      }
      
      return this.sanitizeUser(updated);
    } else {
      throw new ForbiddenException('Not allowed to change status');
    }
  }

  async resetPasswordBySuperAdmin(actor: any, userId: number) {
    if (actor.role !== hr_users_role.SuperAdmin) {
      throw new ForbiddenException('Only SuperAdmin can reset password for users');
    }
    const user = await this.prisma.hr_users.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.authService.forgotPassword({ email: user.email });
    return { message: 'Password reset email sent to user' };
  }

  async bulkUpdateRoleStatus(actor: any, roleName: string, status: 'ACTIVE' | 'INACTIVE') {
    if (actor.role !== hr_users_role.SuperAdmin) {
      throw new ForbiddenException('Only SuperAdmin can bulk update roles');
    }

    let targetRoles: hr_users_role[] = [];
    if (roleName === 'Super Admin') targetRoles = [hr_users_role.SuperAdmin];
    else if (roleName === 'Admin') targetRoles = [hr_users_role.CompanyAdmin, hr_users_role.BranchHR];
    else if (roleName === 'User') targetRoles = [hr_users_role.Employee];
    else if (roleName === 'Auditor') targetRoles = [hr_users_role.PlatformAdmin]; // Using PlatformAdmin for Auditor if needed

    if (targetRoles.length === 0) {
      throw new BadRequestException('Invalid role name');
    }

    const usersToUpdate = await this.prisma.hr_users.findMany({
      where: { role: { in: targetRoles } }
    });

    const targetStatus = status === 'INACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const flags = this.toStatusFlags(targetStatus);

    for (const user of usersToUpdate) {
      // Prevent superadmin from locking themselves
      if (user.user_id === actor.sub) continue;

      const profile = this.parseProfile(user.permissions);
      const nextProfile = {
        ...profile,
        status: targetStatus,
      };
      delete (nextProfile as any).status_request;
      delete (nextProfile as any).status_reason;

      await this.prisma.hr_users.update({
        where: { user_id: user.user_id },
        data: {
          is_active: flags.is_active,
          is_locked: flags.is_locked,
          account_status: targetStatus,
          permissions: JSON.stringify(nextProfile),
        },
      });

      this.sendStatusEmail(user.email, targetStatus);
    }

    return { message: `Bulk updated ${usersToUpdate.length} users to ${targetStatus}` };
  }
}
