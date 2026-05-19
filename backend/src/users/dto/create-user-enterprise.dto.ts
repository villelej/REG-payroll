import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsDateString,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * Base User DTO with common fields for all roles
 */
export class BaseUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  full_name: string;

  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+250788123456' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  national_id?: string;

  @ApiPropertyOptional({ example: 'john_doe' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsIn(['ACTIVE', 'PENDING', 'LOCKED', 'BLOCKED'])
  status?: 'ACTIVE' | 'PENDING' | 'LOCKED' | 'BLOCKED';
}

/**
 * ===== SUPER ADMIN CREATE DTO =====
 * Lightweight DTO for system administrators
 * Super Admin should NOT have payroll fields
 */
export class CreateSuperAdminDto extends BaseUserDto {
  @ApiProperty({ enum: ['SUPER_ADMIN'] })
  role: 'SUPER_ADMIN' = 'SUPER_ADMIN';

  // Password is auto-generated, not from user input
  @ApiPropertyOptional({ example: 'Password will be auto-generated' })
  @IsOptional()
  @IsString()
  password?: string;
}

/**
 * ===== HR / ADMIN CREATE DTO =====
 * For branch HR/Admin users who may or may not be payroll employees
 */
export class CreateHrAdminDto extends BaseUserDto {
  @ApiProperty({
    enum: ['HR', 'ADMIN'],
    example: 'HR',
  })
  @IsIn(['HR', 'ADMIN'])
  role: 'HR' | 'ADMIN';

  @ApiProperty({
    description: 'Branch IDs to assign to this user',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  branch_ids: number[];

  @ApiPropertyOptional({
    description: 'Grant access to all branches in the company',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  can_view_all_branches?: boolean;

  // Optional: only if also a payroll employee
  @ApiPropertyOptional({
    description: 'Job category (only if HR is also an employee)',
    example: 'Manager',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Department ID (only if HR is also an employee)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiPropertyOptional({
    description: 'Contract type (only if HR is also an employee)',
    example: 'Full-Time',
  })
  @IsOptional()
  @IsString()
  contract_type?: string;

  @ApiPropertyOptional({
    description: 'Contract start date (only if HR is also an employee)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  contract_start?: string;

  @ApiPropertyOptional({
    description: 'Contract end date (only if HR is also an employee)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  contract_end?: string;

  @ApiPropertyOptional({
    description: 'Education level (only if HR is also an employee)',
    example: 'Bachelor',
    enum: ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'],
  })
  @IsOptional()
  @IsIn(['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'])
  education_level?: string;

  @ApiPropertyOptional({
    description: 'Payment method (only if HR is also an employee)',
    example: 'BANK',
    enum: ['BANK', 'MOMO', 'CASH'],
  })
  @IsOptional()
  @IsIn(['BANK', 'MOMO', 'CASH'])
  payment_method?: string;

  @ApiPropertyOptional({
    description: 'Payment account/phone number (only if HR is also an employee)',
    example: '250788123456',
  })
  @IsOptional()
  @IsString()
  payment_number?: string;

  @ApiPropertyOptional({ example: 'Password will be auto-generated' })
  @IsOptional()
  @IsString()
  password?: string;
}

/**
 * ===== EMPLOYEE CREATE DTO =====
 * For regular employees in payroll system
 * All payroll fields are required
 */
export class CreateEmployeeDto extends BaseUserDto {
  @ApiProperty({ enum: ['EMPLOYEE'] })
  role: 'EMPLOYEE' = 'EMPLOYEE';

  @ApiProperty({
    description: 'Branch ID where employee is assigned',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  branch_id: number;

  @ApiProperty({
    description: 'Job category/designation (required for employees)',
    example: 'Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Department ID (required for employees)',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  department_id: number;

  @ApiProperty({
    description: 'Post/Position ID (required for employees)',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  post_id: number;

  @ApiProperty({
    description: 'Employment type',
    example: 'Full-Time',
    enum: ['Full-Time', 'Part-Time', 'Contract', 'Temporary'],
  })
  @IsOptional()
  @IsIn(['Full-Time', 'Part-Time', 'Contract', 'Temporary'])
  employment_type?: string;

  @ApiProperty({
    description: 'Contract type',
    example: 'Permanent',
  })
  @IsOptional()
  @IsString()
  contract_type?: string;

  @ApiPropertyOptional({
    description: 'Contract start date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  contract_start?: string;

  @ApiPropertyOptional({
    description: 'Contract end date',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  contract_end?: string;

  @ApiPropertyOptional({
    description: 'Education level',
    example: 'Bachelor',
    enum: ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'],
  })
  @IsOptional()
  @IsIn(['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'])
  education_level?: string;

  @ApiProperty({
    description: 'Payment method (required for employees)',
    example: 'BANK',
    enum: ['BANK', 'MOMO', 'CASH'],
  })
  @IsIn(['BANK', 'MOMO', 'CASH'])
  @IsNotEmpty()
  payment_method: string;

  @ApiProperty({
    description: 'Payment account number or phone (required for employees)',
    example: '250788123456',
  })
  @IsString()
  @IsNotEmpty()
  payment_number: string;

  @ApiPropertyOptional({
    description: 'Monthly salary amount',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional({ example: 'Password will be auto-generated' })
  @IsOptional()
  @IsString()
  password?: string;
}

/**
 * ===== UNIFIED CREATE USER DTO =====
 * Single endpoint DTO that handles all roles
 * Backend validates required fields based on role
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User role',
    enum: ['SUPER_ADMIN', 'HR', 'ADMIN', 'EMPLOYEE'],
    example: 'EMPLOYEE',
  })
  @IsIn(['SUPER_ADMIN', 'HR', 'ADMIN', 'EMPLOYEE'])
  @IsNotEmpty()
  role: 'SUPER_ADMIN' | 'HR' | 'ADMIN' | 'EMPLOYEE';

  // ===== COMMON FIELDS (All roles) =====
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  full_name: string;

  @ApiProperty({ example: 'john@company.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+250788123456' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  national_id?: string;

  @ApiPropertyOptional({ example: 'john_doe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'PENDING', 'LOCKED', 'BLOCKED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'PENDING', 'LOCKED', 'BLOCKED'])
  status?: string;

  // ===== HR/ADMIN FIELDS =====
  @ApiPropertyOptional({
    description: 'For HR/Admin: Branch IDs to assign',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  branch_ids?: number[];

  @ApiPropertyOptional({
    description: 'For HR/Admin: Can view all branches?',
  })
  @IsOptional()
  @IsBoolean()
  can_view_all_branches?: boolean;

  // ===== EMPLOYEE FIELDS =====
  @ApiPropertyOptional({
    description: 'For Employee: Branch ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  branch_id?: number;

  @ApiPropertyOptional({
    description: 'Job category/designation',
    example: 'Manager',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Department ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiPropertyOptional({
    description: 'Position/Post ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  post_id?: number;

  @ApiPropertyOptional({
    description: 'Employment type',
    enum: ['Full-Time', 'Part-Time', 'Contract', 'Temporary'],
  })
  @IsOptional()
  @IsString()
  employment_type?: string;

  @ApiPropertyOptional({
    description: 'Contract type',
    example: 'Permanent',
  })
  @IsOptional()
  @IsString()
  contract_type?: string;

  @ApiPropertyOptional({
    description: 'Contract start date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  contract_start?: string;

  @ApiPropertyOptional({
    description: 'Contract end date',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  contract_end?: string;

  @ApiPropertyOptional({
    description: 'Education level',
    enum: ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'],
  })
  @IsOptional()
  @IsString()
  education_level?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: ['BANK', 'MOMO', 'CASH'],
    example: 'BANK',
  })
  @IsOptional()
  @IsIn(['BANK', 'MOMO', 'CASH'])
  payment_method?: string;

  @ApiPropertyOptional({
    description: 'Payment account number or phone',
    example: '250788123456',
  })
  @IsOptional()
  @IsString()
  payment_number?: string;

  @ApiPropertyOptional({
    description: 'Monthly salary',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional({
    description: 'Password (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
