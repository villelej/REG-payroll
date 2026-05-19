# Enterprise Role-Based User Architecture
## Multi-Role HR & Payroll System — NestJS + Prisma

**Date:** May 18, 2026  
**Status:** Implementation Ready  
**Architecture Level:** Enterprise (Production-Grade)

---

## TABLE OF CONTENTS

1. [Prisma Schema Recommendations](#prisma-schema)
2. [DTO Architecture](#dto-architecture)
3. [Service-Layer Business Rules](#service-layer)
4. [Role-Based Validation Logic](#validation-logic)
5. [Password Generation Strategy](#password-strategy)
6. [JWT Payload Strategy](#jwt-strategy)
7. [Frontend Dynamic Forms](#frontend-forms)
8. [Migration Approach](#migration)
9. [Enterprise Best Practices](#best-practices)

---

## PRISMA SCHEMA RECOMMENDATIONS {#prisma-schema}

### Current Issues
- `category` should be optional for Super Admin and HR
- `branch_id` is required but Super Admin shouldn't have branches
- No proper nullable fields for non-employee roles
- No mutation tracking for audit logs
- Payment fields required everywhere

### Recommended Schema Updates

```prisma
// Keep backward compatibility - mark for deprecation
model hr_users {
  user_id                 Int                   @id @default(autoincrement())
  company_id              Int?
  employee_id             Int?
  
  // ===== CORE ACCOUNT FIELDS (All roles) =====
  username                String                @db.VarChar(50)
  email                   String                @unique @db.VarChar(100)
  password_hash           String
  full_name               String                @db.VarChar(200)
  
  // ===== ROLE & PERMISSIONS =====
  role                    hr_users_role         // SUPER_ADMIN, HR, ADMIN, EMPLOYEE
  
  // ===== BRANCH ASSIGNMENT =====
  branch_id               Int?                  // PRIMARY branch (kept for backward compat)
  canViewAllBranches      Boolean               @default(false)
  
  // ===== AUTHENTICATION & STATUS =====
  password_hash           String
  refresh_token_hash      String?
  activation_token        String?
  activation_expires_at   DateTime?
  
  status                  user_status           // ACTIVE, LOCKED, BLOCKED, PENDING
  is_active               Boolean               @default(true)
  is_locked               Boolean               @default(false)
  must_change_password    Boolean               @default(false)
  
  // ===== PERSONAL INFORMATION =====
  national_id             String?               @db.VarChar(30)  // Optional for Super Admin
  phone_number            String?               @db.VarChar(30)
  date_of_birth           DateTime?             @db.Date
  gender                  String?               @db.VarChar(10)
  profile_photo           String?               @db.LongText      // Base64 or URL
  
  // ===== EMPLOYEE/HR PAYROLL FIELDS (Optional for non-employees) =====
  category                String?               @db.VarChar(120)  // NULL for Super Admin
  department_id           Int?                  // NULL for Super Admin/HR
  post_id                 Int?                  // Position/designation
  contract_type           String?               @db.VarChar(80)   // Optional
  education_level         String?               @db.VarChar(80)   // Optional
  contract_start          DateTime?             @db.Date          // Optional
  contract_end            DateTime?             @db.Date          // Optional
  
  // ===== PAYMENT INFORMATION =====
  payment_method          String?               @db.VarChar(50)   // BANK, MOMO, CASH
  payment_number          String?               @db.VarChar(100)  // Account/Phone
  salary_grade_id         Int?                  // Optional
  
  // ===== AUDIT & METADATA =====
  last_login              DateTime?
  login_attempts          Int                   @default(0)
  created_at              DateTime              @default(now())
  updated_at              DateTime              @updatedAt
  created_by              Int?                  // Audit: who created this user
  updated_by              Int?                  // Audit: who last updated
  
  // ===== LEGACY/DEPRECATED =====
  access_scope            hr_users_access_scope @default(BranchOnly)
  accessible_branches     String?               @db.LongText      // DEPRECATED: use hr_user_branches
  accessible_regions      String?               @db.LongText      // DEPRECATED
  permissions             String?               @db.LongText      // DEPRECATED
  
  // ===== RELATIONS =====
  companies               companies?            @relation(fields: [company_id], references: [company_id])
  employees               employees?            @relation(fields: [employee_id], references: [employee_id])
  branches                branches?             @relation(fields: [branch_id], references: [branch_id])
  user_branches           hr_user_branches[]    // Many-to-many branches
  department              departments?          @relation(fields: [department_id], references: [department_id])
  post                    posts?                @relation(fields: [post_id], references: [post_id])
  created_by_user         hr_users?             @relation("created_by_rel", fields: [created_by], references: [user_id])
  audit_logs              audit_log[]
}

// Junction table for many-to-many branch assignment
model hr_user_branches {
  id                      Int                   @id @default(autoincrement())
  user_id                 Int
  branch_id               Int
  assigned_at             DateTime              @default(now())
  assigned_by             Int?
  
  // Relations
  hr_users                hr_users              @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  branches                branches              @relation(fields: [branch_id], references: [branch_id], onDelete: Cascade)
  assigned_by_user        hr_users?             @relation("assigned_by_rel", fields: [assigned_by], references: [user_id])
  
  @@unique([user_id, branch_id])
  @@index([user_id])
  @@index([branch_id])
}

// Enum for role
enum hr_users_role {
  SUPER_ADMIN
  HR
  ADMIN
  EMPLOYEE
}

// Enum for user status
enum user_status {
  ACTIVE
  PENDING        // Awaiting email activation
  LOCKED         // Locked by admin
  BLOCKED        // Disabled
  INACTIVE       // Soft delete
}
```

---

## DTO ARCHITECTURE {#dto-architecture}

### Design Pattern: Role-Based DTOs

```typescript
// Base DTO with common fields
export class BaseUserDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsPhoneNumber('RW')
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  national_id?: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @IsIn(['ACTIVE', 'PENDING', 'LOCKED', 'BLOCKED'])
  @IsOptional()
  status?: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'BLOCKED' = 'PENDING';
}

// ===== SUPER ADMIN CREATE DTO =====
export class CreateSuperAdminDto extends BaseUserDto {
  // Super Admin ONLY needs these fields
  // No category, no branch, no salary
  
  // Generated fields (not from user input)
  password?: string; // Will be auto-generated
}

// ===== HR / ADMIN CREATE DTO =====
export class CreateHrAdminDto extends BaseUserDto {
  // Required for HR/Admin
  @IsNotEmpty()
  @IsArray()
  branch_ids: number[]; // Multiple branches via junction table

  @IsOptional()
  @IsBoolean()
  can_view_all_branches?: boolean;

  // Optional: only if also a payroll employee
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  contract_type?: string;

  @IsOptional()
  @IsDateString()
  contract_start?: string;

  @IsOptional()
  @IsDateString()
  contract_end?: string;

  @IsOptional()
  @IsString()
  education_level?: string;

  @IsOptional()
  @IsIn(['BANK', 'MOMO', 'CASH'])
  payment_method?: string;

  @IsOptional()
  @IsString()
  payment_number?: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  password?: string; // Will be auto-generated
}

// ===== EMPLOYEE CREATE DTO =====
export class CreateEmployeeDto extends BaseUserDto {
  // Required for employees
  @IsNotEmpty()
  @IsNumber()
  branch_id: number;

  @IsNotEmpty()
  @IsString()
  category: string; // Job category is mandatory

  @IsNotEmpty()
  @IsNumber()
  department_id: number;

  @IsNotEmpty()
  @IsNumber()
  post_id: number;

  @IsNotEmpty()
  @IsDateString()
  joining_date: string;

  // Salary/Payment
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  salary: number;

  @IsNotEmpty()
  @IsIn(['BANK', 'MOMO', 'CASH'])
  payment_method: string;

  @IsNotEmpty()
  @IsString()
  payment_number: string;

  // Optional
  @IsOptional()
  @IsString()
  contract_type?: string;

  @IsOptional()
  @IsDateString()
  contract_start?: string;

  @IsOptional()
  @IsDateString()
  contract_end?: string;

  @IsOptional()
  @IsString()
  education_level?: string;

  @IsOptional()
  @IsString()
  employment_type?: string;

  password?: string; // Will be auto-generated
}

// ===== UNIFIED CREATE DTO =====
// For controller that handles all roles
export class CreateUserDto {
  @IsIn(['SUPER_ADMIN', 'HR', 'ADMIN', 'EMPLOYEE'])
  @IsNotEmpty()
  role: 'SUPER_ADMIN' | 'HR' | 'ADMIN' | 'EMPLOYEE';

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber('RW')
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  national_id?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  // For HR/Admin
  @IsArray()
  @IsOptional()
  branch_ids?: number[];

  @IsBoolean()
  @IsOptional()
  can_view_all_branches?: boolean;

  // For Employee/HR payroll
  @IsNumber()
  @IsOptional()
  branch_id?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  department_id?: number;

  @IsNumber()
  @IsOptional()
  post_id?: number;

  @IsDateString()
  @IsOptional()
  joining_date?: string;

  @IsString()
  @IsOptional()
  contract_type?: string;

  @IsDateString()
  @IsOptional()
  contract_start?: string;

  @IsDateString()
  @IsOptional()
  contract_end?: string;

  @IsString()
  @IsOptional()
  education_level?: string;

  @IsIn(['BANK', 'MOMO', 'CASH'])
  @IsOptional()
  payment_method?: string;

  @IsString()
  @IsOptional()
  payment_number?: string;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  employment_type?: string;

  // Optional
  @IsString()
  @IsOptional()
  password?: string; // Will be auto-generated if not provided
}
```

---

## SERVICE-LAYER BUSINESS RULES {#service-layer}

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async create(actor: JwtPayload, dto: CreateUserDto) {
    // ===== 1. AUTHORIZATION CHECK =====
    this.validateCreationPermission(actor);

    // ===== 2. SANITIZE & VALIDATE BY ROLE =====
    const sanitized = this.sanitizeByRole(dto);

    // ===== 3. VALIDATE REQUIRED FIELDS BY ROLE =====
    this.validateRequiredFieldsByRole(sanitized);

    // ===== 4. CHECK CONFLICTS =====
    await this.checkForConflicts(sanitized);

    // ===== 5. GENERATE PASSWORD =====
    const password = sanitized.password || this.passwordService.generateTemporary();
    const password_hash = await this.passwordService.hash(password);

    // ===== 6. CREATE USER TRANSACTION =====
    const user = await this.prisma.$transaction(async (tx) => {
      // Create base user
      const createdUser = await tx.hr_users.create({
        data: {
          full_name: sanitized.full_name,
          email: sanitized.email,
          username: sanitized.username || sanitized.email.split('@')[0],
          password_hash,
          role: sanitized.role,
          phone_number: sanitized.phone_number || null,
          national_id: sanitized.national_id || null,
          date_of_birth: sanitized.date_of_birth ? new Date(sanitized.date_of_birth) : null,
          status: 'PENDING',
          is_active: true,
          must_change_password: true, // Force password change on first login
          
          // Conditional fields
          ...(sanitized.role === 'EMPLOYEE' && {
            category: sanitized.category,
            department_id: sanitized.department_id,
            post_id: sanitized.post_id,
            contract_type: sanitized.contract_type || null,
            contract_start: sanitized.contract_start ? new Date(sanitized.contract_start) : null,
            contract_end: sanitized.contract_end ? new Date(sanitized.contract_end) : null,
            education_level: sanitized.education_level || null,
            payment_method: sanitized.payment_method || null,
            payment_number: sanitized.payment_number || null,
          }),
          
          ...(sanitized.role !== 'SUPER_ADMIN' && {
            payment_method: sanitized.payment_method || null,
            payment_number: sanitized.payment_number || null,
            education_level: sanitized.education_level || null,
            contract_type: sanitized.contract_type || null,
            contract_start: sanitized.contract_start ? new Date(sanitized.contract_start) : null,
            contract_end: sanitized.contract_end ? new Date(sanitized.contract_end) : null,
          }),
          
          created_by: actor.sub,
          company_id: actor.companyId,
        },
      });

      // Handle branch assignments for HR/Admin
      if ((sanitized.role === 'HR' || sanitized.role === 'ADMIN') && sanitized.branch_ids?.length > 0) {
        await tx.hr_user_branches.createMany({
          data: sanitized.branch_ids.map((branchId) => ({
            user_id: createdUser.user_id,
            branch_id: branchId,
            assigned_by: actor.sub,
          })),
        });

        // Set primary branch (first one)
        await tx.hr_users.update({
          where: { user_id: createdUser.user_id },
          data: {
            branch_id: sanitized.branch_ids[0],
            canViewAllBranches: sanitized.can_view_all_branches || false,
          },
        });
      }

      return createdUser;
    });

    // ===== 7. LOG AUDIT =====
    await this.auditLog(actor, 'USER_CREATED', user.user_id, {
      role: sanitized.role,
      email: user.email,
    });

    // ===== 8. RETURN (WITHOUT PASSWORD) =====
    return this.sanitizeResponse(user);
  }

  // ===== VALIDATION METHODS =====

  private validateCreationPermission(actor: JwtPayload) {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can create users');
    }
  }

  private sanitizeByRole(dto: CreateUserDto): any {
    const sanitized: any = {
      full_name: dto.full_name,
      email: dto.email?.toLowerCase().trim(),
      username: dto.username?.trim(),
      phone_number: dto.phone_number,
      national_id: dto.national_id,
      date_of_birth: dto.date_of_birth,
      role: dto.role,
    };

    // ===== SUPER ADMIN: REMOVE payroll fields =====
    if (dto.role === 'SUPER_ADMIN') {
      // Ignore/remove all payroll-related fields
      return sanitized;
    }

    // ===== HR/ADMIN: Include optional employee fields =====
    if (dto.role === 'HR' || dto.role === 'ADMIN') {
      sanitized.branch_ids = dto.branch_ids;
      sanitized.can_view_all_branches = dto.can_view_all_branches;
      sanitized.category = dto.category || null;
      sanitized.department_id = dto.department_id || null;
      sanitized.contract_type = dto.contract_type || null;
      sanitized.contract_start = dto.contract_start || null;
      sanitized.contract_end = dto.contract_end || null;
      sanitized.education_level = dto.education_level || null;
      sanitized.payment_method = dto.payment_method || null;
      sanitized.payment_number = dto.payment_number || null;
      return sanitized;
    }

    // ===== EMPLOYEE: Include all employee fields =====
    if (dto.role === 'EMPLOYEE') {
      sanitized.branch_id = dto.branch_id;
      sanitized.category = dto.category;
      sanitized.department_id = dto.department_id;
      sanitized.post_id = dto.post_id;
      sanitized.contract_type = dto.contract_type || null;
      sanitized.contract_start = dto.contract_start || null;
      sanitized.contract_end = dto.contract_end || null;
      sanitized.education_level = dto.education_level || null;
      sanitized.payment_method = dto.payment_method;
      sanitized.payment_number = dto.payment_number;
      return sanitized;
    }

    return sanitized;
  }

  private validateRequiredFieldsByRole(sanitized: any) {
    // ===== SUPER ADMIN: Minimal validation =====
    if (sanitized.role === 'SUPER_ADMIN') {
      if (!sanitized.full_name?.trim()) throw new BadRequestException('Full name is required');
      if (!sanitized.email?.trim()) throw new BadRequestException('Email is required');
      return;
    }

    // ===== HR/ADMIN =====
    if (sanitized.role === 'HR' || sanitized.role === 'ADMIN') {
      if (!sanitized.full_name?.trim()) throw new BadRequestException('Full name is required');
      if (!sanitized.email?.trim()) throw new BadRequestException('Email is required');
      if (!sanitized.branch_ids?.length) {
        throw new BadRequestException('At least one branch must be assigned');
      }
      // Other fields are optional
      return;
    }

    // ===== EMPLOYEE =====
    if (sanitized.role === 'EMPLOYEE') {
      if (!sanitized.full_name?.trim()) throw new BadRequestException('Full name is required');
      if (!sanitized.email?.trim()) throw new BadRequestException('Email is required');
      if (!sanitized.branch_id) throw new BadRequestException('Branch is required');
      if (!sanitized.category?.trim()) throw new BadRequestException('Category is required');
      if (!sanitized.department_id) throw new BadRequestException('Department is required');
      if (!sanitized.payment_method) throw new BadRequestException('Payment method is required');
      if (!sanitized.payment_number) throw new BadRequestException('Payment number is required');
      return;
    }
  }

  private async checkForConflicts(sanitized: any) {
    const conflicts = await this.prisma.hr_users.findMany({
      where: {
        OR: [
          { email: sanitized.email },
          ...(sanitized.national_id ? [{ national_id: sanitized.national_id }] : []),
        ],
      },
    });

    if (conflicts.length > 0) {
      const errors = [];
      if (conflicts.some(c => c.email === sanitized.email)) {
        errors.push('Email already exists');
      }
      if (sanitized.national_id && conflicts.some(c => c.national_id === sanitized.national_id)) {
        errors.push('National ID already exists');
      }
      throw new BadRequestException(errors);
    }
  }

  private sanitizeResponse(user: any) {
    const { password_hash, refresh_token_hash, activation_token, ...safe } = user;
    return safe;
  }

  private async auditLog(actor: JwtPayload, action: string, userId: number, details: any) {
    // Implement audit logging
  }
}
```

---

## PASSWORD GENERATION STRATEGY {#password-strategy}

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordService {
  /**
   * Generate a temporary password that:
   * - Is strong (uppercase, lowercase, number, special char)
   * - Is memorable enough for email
   * - Force user to change on first login
   */
  generateTemporary(): string {
    // Format: Capital + lowercase + number + special = Hr@4821
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@#$%&';

    const chars = [
      uppercase[Math.floor(Math.random() * uppercase.length)],
      lowercase[Math.floor(Math.random() * lowercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ];

    // Add 4 more random chars for strength
    const all = uppercase + lowercase + numbers;
    for (let i = 0; i < 4; i++) {
      chars.push(all[Math.floor(Math.random() * all.length)]);
    }

    // Shuffle
    return chars.sort(() => Math.random() - 0.5).join('');
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

---

## JWT PAYLOAD STRATEGY {#jwt-strategy}

```typescript
export interface JwtPayload {
  // Essential
  sub: number;           // user_id
  email: string;
  role: string;          // SUPER_ADMIN, HR, ADMIN, EMPLOYEE
  
  // Company/Org
  companyId: number;
  
  // Branch Access (for HR/Employee)
  branchId?: number;                 // Primary branch (backward compat)
  branches?: number[];               // All assigned branches
  canViewAllBranches?: boolean;      // HR permission
  
  // Metadata
  iat: number;           // issued at
  exp: number;           // expiration
  aud: string;           // audience
}

// Example tokens:
// SUPER_ADMIN: { sub: 1, email, role: 'SUPER_ADMIN', companyId: 1 }
// HR: { sub: 2, email, role: 'HR', companyId: 1, branchId: 3, branches: [3,4,5], canViewAllBranches: false }
// EMPLOYEE: { sub: 3, email, role: 'EMPLOYEE', companyId: 1, branchId: 3 }
```

---

## FRONTEND DYNAMIC FORMS {#frontend-forms}

### Key UI Logic

```typescript
// Get role from form
const selectedRole = formData.role;

// ===== SUPER ADMIN FORM =====
if (selectedRole === 'SUPER_ADMIN') {
  showFields = [
    'fullName',      // Required
    'email',         // Required
    'phoneNumber',   // Optional
    'nationalId',    // Optional
    'status',        // Optional
  ];
  hideFields = [
    'branch',
    'category',
    'salary',
    'paymentMethod',
    'contractDates',
  ];
}

// ===== HR / ADMIN FORM =====
if (selectedRole === 'HR' || selectedRole === 'ADMIN') {
  showFields = [
    'fullName',           // Required
    'email',              // Required
    'branchAssignment',   // Required (multi-select)
    'canViewAll',         // Optional checkbox
    'category',           // Optional
    'contractType',       // Optional
    'paymentMethod',      // Optional
  ];
  hideFields = [];
}

// ===== EMPLOYEE FORM =====
if (selectedRole === 'EMPLOYEE') {
  showFields = [
    'fullName',        // Required
    'email',           // Required
    'branch',          // Required
    'category',        // Required
    'department',      // Required
    'position',        // Required
    'salary',          // Required
    'paymentMethod',   // Required
    'paymentNumber',   // Required
    'contractType',    // Optional
    'contractDates',   // Optional
  ];
}

// ===== PASSWORD HANDLING (All Roles) =====
// Never show password field - always auto-generated
// Show: "Password will be auto-generated and sent via email"
// User must reset on first login
```

---

## MIGRATION APPROACH {#migration}

### Phase 1: Schema (Non-Breaking)
1. Add new columns as `NULLABLE` (all optional)
2. Create `hr_user_branches` junction table
3. No data migration needed immediately
4. Existing users continue to work

### Phase 2: Application
1. Deploy new DTOs with role-based validation
2. Update user creation service
3. Test all roles thoroughly
4. New users follow new schema

### Phase 3: Data Migration (Future)
1. Script to populate `hr_user_branches` from existing `branch_id`
2. Remove deprecated columns after 3 months
3. Backward compat layer removal

---

## ENTERPRISE BEST PRACTICES {#best-practices}

### 1. Backend is Source of Truth
- ✅ Validation happens in service layer
- ✅ DTO validation enforced
- ✅ Frontend validation is UX only
- ✅ Never trust frontend alone

### 2. Role-Based Field Requirements
- ✅ Different DTOs per role
- ✅ Sanitize input before processing
- ✅ Validate required fields by role
- ✅ Ignore/reject unexpected fields

### 3. Password Security
- ✅ Auto-generate strong temporary passwords
- ✅ Force password change on first login
- ✅ Never use weak defaults (123456, password, etc.)
- ✅ Hash with bcrypt (rounds: 10)

### 4. Audit Trail
- ✅ Log user creation with actor ID
- ✅ Track who created what and when
- ✅ Store original role/branch assignments
- ✅ Enable compliance reporting

### 5. Database Constraints
- ✅ Unique indexes on email
- ✅ Foreign key constraints with CASCADE
- ✅ NOT NULL for required fields
- ✅ Check constraints for enums

### 6. Backward Compatibility
- ✅ Keep `branch_id` for existing users
- ✅ Junction table is additive (no breaking change)
- ✅ New columns are nullable (old code still works)
- ✅ Deprecation timeline: 3-6 months

### 7. Documentation
- ✅ Clear field requirements per role
- ✅ Examples for each role
- ✅ API documentation with Swagger
- ✅ Migration guide for teams

---

## EXAMPLE QUERIES {#queries}

```typescript
// Get all branches for HR user
const branches = await prisma.hr_user_branches.findMany({
  where: { user_id: hrUserId },
  include: { branches: true },
});

// Check if user can access branch
const hasAccess = await prisma.hr_user_branches.findUnique({
  where: { user_id_branch_id: { user_id, branch_id } },
});

// Get all HR users in a company
const hrUsers = await prisma.hr_users.findMany({
  where: { 
    company_id,
    role: { in: ['HR', 'ADMIN'] },
  },
  include: { user_branches: true },
});

// Get employee with branch
const employee = await prisma.hr_users.findUnique({
  where: { user_id },
  include: { 
    branches: true,
    departments: true,
  },
});
```

---

## SUMMARY TABLE

| Field | Super Admin | HR/Admin | Employee |
|-------|-----------|----------|----------|
| full_name | Required | Required | Required |
| email | Required | Required | Required |
| phone | Optional | Optional | Optional |
| national_id | Optional | Optional | Optional |
| branch | ❌ NO | Required | Required |
| category | ❌ NO | Optional | Required |
| department | ❌ NO | Optional | Required |
| payment_method | ❌ NO | Optional | Required |
| payment_number | ❌ NO | Optional | Required |
| salary | ❌ NO | Optional | Optional |
| contract_dates | ❌ NO | Optional | Optional |
| education_level | ❌ NO | Optional | Optional |
| password | Auto-gen | Auto-gen | Auto-gen |
| must_change | YES | YES | YES |
| Status | PENDING | PENDING | PENDING |
