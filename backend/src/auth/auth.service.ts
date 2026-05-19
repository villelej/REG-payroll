import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { ActivateDto } from './dto/activate.dto';
import { CreateHrDto } from './dto/create-hr.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { hr_users_role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from './password-policy';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notifications: NotificationsService,
  ) {}

  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async sendResetEmail(to: string, resetLink: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || user || 'no-reply@reserve.local';

    if (!host || !user || !pass) {
      console.warn(
        `SMTP not configured. Reset link for ${to}: ${resetLink}`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.verify();

    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your payroll account password',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p>Hello,</p>
          <p>We received a request to reset your Reserve Force Payroll account password.</p>
          <p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 16px; background: #0b6bcb; color: #fff; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  async login(loginDto: LoginDto) {
    try {
      const identifier = (loginDto.identifier || loginDto.email || '').trim();
      if (!identifier) {
        throw new UnauthorizedException('Invalid credentials');
      }

      let user;
      try {
        user = await this.prisma.hr_users.findFirst({
          where: {
            OR: [{ email: identifier }, { username: identifier }],
          },
          include: {
            branches: true,
          },
        });
      } catch (e) {
        // Fall back to direct MariaDB query if Prisma adapter fails
        try {
          const mariadb = require('mariadb');
          const pool = mariadb.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'payroll',
            connectionLimit: 5,
          });
          const rows = await pool.query(
            'SELECT * FROM hr_users WHERE email = ? OR username = ? LIMIT 1',
            [identifier, identifier],
          );
          if (rows && rows.length) {
            user = rows[0];
          }
          await pool.end();
        } catch (innerErr) {
          // Log and continue to avoid throwing internal errors to clients

          console.error('Fallback DB query failed in login():', innerErr);
        }
      }

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.is_active || user.is_locked) {
        throw new UnauthorizedException(
          'Login Failed because your account is locked/blocked, please contact HR/admin'
        );
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: user.user_id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        employeeId: user.employee_id,
        branchId: user.branch_id,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

      try {
        await this.prisma.hr_users.update({
          where: { user_id: user.user_id },
          data: { refresh_token_hash: refreshTokenHash },
        });
      } catch (e) {
        // fall back to raw SQL update
        try {
          const mariadb = require('mariadb');
          const pool = mariadb.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'payroll',
            connectionLimit: 5,
          });
          await pool.query(
            'UPDATE hr_users SET refresh_token_hash = ? WHERE user_id = ?',
            [refreshTokenHash, user.user_id],
          );
          await pool.end();
        } catch (innerErr) {
          // log but do not fail the login

          console.error('Fallback DB update failed in login():', innerErr);
        }
      }

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
          companyId: user.company_id,
          branchId: user.branch_id,
          branch: (user as any).branches?.branch_name || null,
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      // Log the internal error for diagnostics but return a safe auth error to the client

      console.error('Unexpected error in AuthService.login():', err);
      try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(process.cwd(), 'auth-error.log');
        const entry = `[${new Date().toISOString()}] ${err && err.stack ? err.stack : JSON.stringify(err)}\n\n`;
        fs.appendFileSync(logPath, entry, { encoding: 'utf8' });
      } catch (e) {
        // ignore file write errors
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(userId: number) {
    await this.prisma.hr_users.update({
      where: { user_id: userId },
      data: { refresh_token_hash: null },
    });
    return { message: 'Logged out successfully' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.hr_users.findUnique({
        where: { user_id: payload.sub },
      });

      if (!user || !user.refresh_token_hash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isTokenValid = await bcrypt.compare(
        refreshToken,
        user.refresh_token_hash,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: user.user_id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        branchId: user.branch_id,
      };
      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async createHr(dto: CreateHrDto) {
    const existingUser = await this.prisma.hr_users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const activationToken = uuidv4();

    const hr = await this.prisma.hr_users.create({
      data: {
        company_id: dto.companyId,
        email: dto.email,
        username: dto.username,
        full_name: dto.fullName,
        role: dto.role || hr_users_role.BranchHR,
        employee_id: dto.employeeId || null,
        password_hash: '', // Will be set during activation
        activation_token: activationToken,
        activation_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
        is_active: false,
      },
    });

    // In a real app, send email here
    return {
      message: 'HR user created. Activation token generated.',
      activationToken, // Returning for testing purposes as per prompt flow
    };
  }

  async activate(dto: ActivateDto) {
    const user = await this.prisma.hr_users.findFirst({
      where: { activation_token: dto.token },
    });

    if (
      !user ||
      (user.activation_expires_at && user.activation_expires_at < new Date())
    ) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    if (!isStrongPassword(dto.password)) {
      throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.hr_users.update({
      where: { user_id: user.user_id },
      data: {
        password_hash: hashedPassword,
        is_active: true,
        activation_token: null,
      },
    });

    return { message: 'Account activated successfully' };
  }

  async changePassword(userId: number, dto: any) {
    const user = await this.prisma.hr_users.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    if (!isStrongPassword(dto.newPassword)) {
      throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
    }

    const isSameAsCurrent = await bcrypt.compare(dto.newPassword, user.password_hash);
    if (isSameAsCurrent) {
      throw new BadRequestException(
        'New password must be different from your current password',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.hr_users.update({
      where: { user_id: userId },
      data: {
        password_hash: hashedPassword,
        must_change_password: false,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async getAllUsers(companyId?: number) {
    return this.prisma.hr_users.findMany({
      where: {
        ...(companyId ? { company_id: companyId } : {}),
        role: {
          in: [
            hr_users_role.PlatformAdmin,
            hr_users_role.SuperAdmin,
            hr_users_role.CompanyAdmin,
            hr_users_role.BranchHR,
            hr_users_role.Employee,
          ],
        },
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
        company_id: true,
      },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.hr_users.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        message:
          'If the email exists, a password reset link has been sent successfully.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.hr_users.update({
      where: { user_id: user.user_id },
      data: {
        activation_token: tokenHash,
        activation_expires_at: expiresAt,
      },
    });

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendBase}/reset-password?token=${rawToken}`;
    await this.sendResetEmail(user.email, resetLink);

    // Notify SuperAdmins that a user requested a password reset
    await this.notifications.notifySuperAdmins(
      user.company_id || 1,
      'Password Reset Requested',
      `User ${user.email} has requested a password reset.`,
      'SecurityAlert',
      '/settings/security'
    );

    return {
      message:
        'If the email exists, a password reset link has been sent successfully.',
    };
  }

  async verifyResetToken(token: string) {
    if (!token) {
      throw new BadRequestException('Missing reset token');
    }

    const tokenHash = this.hashResetToken(token);
    const user = await this.prisma.hr_users.findFirst({
      where: {
        activation_token: tokenHash,
        activation_expires_at: { gt: new Date() },
      },
      select: { user_id: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashResetToken(dto.token);
    const user = await this.prisma.hr_users.findFirst({
      where: {
        activation_token: tokenHash,
        activation_expires_at: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!isStrongPassword(dto.newPassword)) {
      throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
    }

    const isSameAsCurrent = await bcrypt.compare(dto.newPassword, user.password_hash);
    if (isSameAsCurrent) {
      throw new BadRequestException(
        'New password must be different from your current password',
      );
    }

    const password_hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.hr_users.update({
      where: { user_id: user.user_id },
      data: {
        password_hash,
        activation_token: null,
        activation_expires_at: null,
        must_change_password: false,
      },
    });

    // Notify the user that their password was reset
    await this.notifications.notifyUser(
      user.user_id,
      user.company_id || 1,
      'Password Reset Successful',
      'Your password has been successfully reset. If you did not perform this action, contact the Super Admin immediately.',
      'SecurityAlert',
      '/settings/profile'
    );

    return { message: 'Password reset successful' };
  }
}
