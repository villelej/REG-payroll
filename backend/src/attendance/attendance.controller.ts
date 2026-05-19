import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('checkin')
  @ApiOperation({ summary: 'Check-in for the day' })
  checkIn(@Req() req) {
    return this.attendanceService.checkIn(req.user.userId);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Check-out for the day' })
  checkOut(@Req() req) {
    return this.attendanceService.checkOut(req.user.userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my attendance history' })
  getMyAttendance(@Req() req) {
    return this.attendanceService.getMyAttendance(req.user.userId);
  }
}
