import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ActivateDto } from './dto/activate.dto';
import { CreateHrDto } from './dto/create-hr.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { hr_users_role } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and get access token' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate account with token and set password' })
  async activate(@Body() activateDto: ActivateDto) {
    return this.authService.activate(activateDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Get('reset-password/verify')
  @ApiOperation({ summary: 'Verify password reset token' })
  async verifyResetToken(@Query('token') token: string) {
    return this.authService.verifyResetToken(token || '');
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req) {
    return this.authService.logout(req.user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(hr_users_role.SuperAdmin)
  @Post('admin/create-hr')
  @ApiOperation({ summary: 'Create HR user (Super Admin only)' })
  async createHr(@Body() createHrDto: CreateHrDto) {
    return this.authService.createHr(createHrDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  changePassword(@Req() req, @Body() body: any) {
    return this.authService.changePassword(req.user.userId, body);
  }

  @ApiBearerAuth()
  @Roles(hr_users_role.SuperAdmin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('users')
  @ApiOperation({ summary: 'Get all HR users (Super Admin only)' })
  getAllUsers(@Req() req) {
    return this.authService.getAllUsers();
  }
}
