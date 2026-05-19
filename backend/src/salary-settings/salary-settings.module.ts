import { Module } from '@nestjs/common';
import { SalarySettingsService } from './salary-settings.service';
import { SalarySettingsController } from './salary-settings.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SalarySettingsController],
  providers: [SalarySettingsService, PrismaService],
})
export class SalarySettingsModule {}
