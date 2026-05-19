import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get user counters for dashboard' })
  users(@Req() req) {
    return this.statsService.getUserStats(req.user);
  }

  @Get('users-by-role')
  @ApiOperation({ summary: 'Get users grouped by role' })
  usersByRole(@Req() req) {
    return this.statsService.usersByRole(req.user);
  }

  @Get('users-by-branch')
  @ApiOperation({ summary: 'Get users grouped by branch' })
  usersByBranch(@Req() req) {
    return this.statsService.usersByBranch(req.user);
  }

  @Get('payroll-status')
  @ApiOperation({ summary: 'Get payroll status breakdown' })
  payrollStatusBreakdown(@Req() req) {
    return this.statsService.payrollStatusBreakdown(req.user);
  }
}
