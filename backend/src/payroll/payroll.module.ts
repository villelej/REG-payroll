import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '../prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PayrollEligibleService } from './payroll-eligible.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollEligibleService],
  exports: [PayrollService, PayrollEligibleService],
})
export class PayrollModule {}
