import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user-enterprise.dto';

/**
 * Role-Based Validation Service
 * 
 * Validates user data based on their assigned role
 * - Super Admin: Minimal fields required
 * - HR/Admin: Branch assignment required, payroll optional
 * - Employee: Full payroll information required
 */
@Injectable()
export class RoleBasedValidationService {
  /**
   * Validate and sanitize user data based on role
   * Returns only relevant fields for the role
   */
  sanitizeByRole(dto: CreateUserDto): Partial<CreateUserDto> {
    const sanitized: any = {
      full_name: dto.full_name?.trim(),
      email: dto.email?.toLowerCase().trim(),
      username: dto.username?.trim(),
      phone_number: dto.phone_number,
      national_id: dto.national_id,
      date_of_birth: dto.date_of_birth,
      status: dto.status || 'PENDING',
      role: dto.role,
    };

    switch (dto.role) {
      case 'SUPER_ADMIN':
        // Super Admin: Remove all payroll fields
        return sanitized;

      case 'HR':
      case 'ADMIN':
        // HR/Admin: Include optional employee fields
        return {
          ...sanitized,
          branch_ids: dto.branch_ids,
          can_view_all_branches: dto.can_view_all_branches || false,
          category: dto.category || null,
          department_id: dto.department_id || null,
          contract_type: dto.contract_type || null,
          contract_start: dto.contract_start || null,
          contract_end: dto.contract_end || null,
          education_level: dto.education_level || null,
          payment_method: dto.payment_method || null,
          payment_number: dto.payment_number || null,
        };

      case 'EMPLOYEE':
        // Employee: Include all employee fields
        return {
          ...sanitized,
          branch_id: dto.branch_id,
          category: dto.category || null,
          department_id: dto.department_id || null,
          post_id: dto.post_id || null,
          employment_type: dto.employment_type || null,
          contract_type: dto.contract_type || null,
          contract_start: dto.contract_start || null,
          contract_end: dto.contract_end || null,
          education_level: dto.education_level || null,
          payment_method: dto.payment_method || null,
          payment_number: dto.payment_number || null,
          salary: dto.salary || null,
        };

      default:
        throw new BadRequestException(`Invalid role: ${dto.role}`);
    }
  }

  /**
   * Validate required fields based on role
   * Throws if required field is missing
   */
  validateRequiredFieldsByRole(sanitized: any): void {
    const role = sanitized.role;

    // ===== COMMON VALIDATION (All roles) =====
    if (!sanitized.full_name?.trim()) {
      throw new BadRequestException('Full name is required');
    }
    if (!sanitized.email?.trim()) {
      throw new BadRequestException('Email is required');
    }

    // ===== SUPER ADMIN =====
    if (role === 'SUPER_ADMIN') {
      // Minimal validation - only basic fields required
      return;
    }

    // ===== HR / ADMIN =====
    if (role === 'HR' || role === 'ADMIN') {
      if (!sanitized.branch_ids || sanitized.branch_ids.length === 0) {
        throw new BadRequestException(
          `At least one branch must be assigned for ${role} users. ` +
          'Alternatively, enable "can_view_all_branches".',
        );
      }
      // Other fields are optional for HR/Admin
      return;
    }

    // ===== EMPLOYEE =====
    if (role === 'EMPLOYEE') {
      if (!sanitized.branch_id) {
        throw new BadRequestException('Branch is required for employees');
      }
      if (!sanitized.category?.trim()) {
        throw new BadRequestException('Category/Job designation is required for employees');
      }
      if (!sanitized.department_id) {
        throw new BadRequestException('Department is required for employees');
      }
      if (!sanitized.post_id) {
        throw new BadRequestException('Position/Post is required for employees');
      }
      if (!sanitized.payment_method) {
        throw new BadRequestException('Payment method is required for employees');
      }
      if (!sanitized.payment_number) {
        throw new BadRequestException('Payment account/phone number is required for employees');
      }
      return;
    }
  }

  /**
   * Get required fields list for a role
   * Useful for frontend to know what fields to show
   */
  getRequiredFieldsByRole(role: string): string[] {
    switch (role) {
      case 'SUPER_ADMIN':
        return ['full_name', 'email'];

      case 'HR':
      case 'ADMIN':
        return ['full_name', 'email', 'branch_ids'];

      case 'EMPLOYEE':
        return [
          'full_name',
          'email',
          'branch_id',
          'category',
          'department_id',
          'post_id',
          'payment_method',
          'payment_number',
        ];

      default:
        return [];
    }
  }

  /**
   * Get optional fields for a role
   */
  getOptionalFieldsByRole(role: string): string[] {
    switch (role) {
      case 'SUPER_ADMIN':
        return ['phone_number', 'national_id', 'username', 'date_of_birth'];

      case 'HR':
      case 'ADMIN':
        return [
          'phone_number',
          'national_id',
          'username',
          'date_of_birth',
          'category',
          'department_id',
          'contract_type',
          'contract_start',
          'contract_end',
          'education_level',
          'payment_method',
          'payment_number',
        ];

      case 'EMPLOYEE':
        return [
          'phone_number',
          'national_id',
          'username',
          'date_of_birth',
          'employment_type',
          'contract_type',
          'contract_start',
          'contract_end',
          'education_level',
          'salary',
        ];

      default:
        return [];
    }
  }

  /**
   * Get hidden fields for a role (should not be sent)
   */
  getHiddenFieldsByRole(role: string): string[] {
    switch (role) {
      case 'SUPER_ADMIN':
        // Super Admin should never have these
        return [
          'branch_id',
          'branch_ids',
          'category',
          'department_id',
          'post_id',
          'payment_method',
          'payment_number',
          'salary',
          'contract_type',
          'contract_start',
          'contract_end',
          'employment_type',
        ];

      case 'HR':
      case 'ADMIN':
        // HR doesn't have single branch_id requirement
        return [];

      case 'EMPLOYEE':
        // Employees don't have branch_ids (array)
        return ['branch_ids', 'can_view_all_branches'];

      default:
        return [];
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (Rwanda +250)
   */
  validatePhone(phone: string): boolean {
    // Rwanda phone format: +250xxx or 250xxx or 0xxx
    const phoneRegex = /^(\+250|250|0)[1-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate national ID format
   */
  validateNationalId(nationalId: string): boolean {
    // Rwanda national ID: 16 digits
    const idRegex = /^\d{16}$/;
    return idRegex.test(nationalId.replace(/\D/g, ''));
  }

  /**
   * Get field validation rules for role
   * Useful for frontend form validation
   */
  getValidationRules(role: string): Record<string, any> {
    const baseRules = {
      full_name: { required: true, minLength: 2, maxLength: 200 },
      email: { required: true, type: 'email' },
      phone_number: { required: false, type: 'tel' },
      national_id: { required: false, pattern: 'digits' },
      username: { required: false, minLength: 3, maxLength: 50 },
      date_of_birth: { required: false, type: 'date' },
      status: { required: false, enum: ['ACTIVE', 'PENDING', 'LOCKED', 'BLOCKED'] },
    };

    switch (role) {
      case 'SUPER_ADMIN':
        return baseRules;

      case 'HR':
      case 'ADMIN':
        return {
          ...baseRules,
          branch_ids: { required: true, type: 'array', minLength: 1 },
          can_view_all_branches: { required: false, type: 'boolean' },
          category: { required: false, type: 'string' },
          department_id: { required: false, type: 'number' },
          contract_type: { required: false, type: 'string' },
          education_level: { required: false, enum: ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'] },
          payment_method: { required: false, enum: ['BANK', 'MOMO', 'CASH'] },
          payment_number: { required: false, type: 'string' },
        };

      case 'EMPLOYEE':
        return {
          ...baseRules,
          branch_id: { required: true, type: 'number' },
          category: { required: true, type: 'string' },
          department_id: { required: true, type: 'number' },
          post_id: { required: true, type: 'number' },
          employment_type: { required: false, enum: ['Full-Time', 'Part-Time', 'Contract', 'Temporary'] },
          contract_type: { required: false, type: 'string' },
          contract_start: { required: false, type: 'date' },
          contract_end: { required: false, type: 'date' },
          education_level: { required: false, enum: ['Primary', 'Secondary', 'Diploma', 'Bachelor', 'Master', 'PhD'] },
          payment_method: { required: true, enum: ['BANK', 'MOMO', 'CASH'] },
          payment_number: { required: true, type: 'string' },
          salary: { required: false, type: 'number', min: 0 },
        };

      default:
        return baseRules;
    }
  }
}
