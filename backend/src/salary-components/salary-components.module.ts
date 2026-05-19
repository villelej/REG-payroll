import { Module } from '@nestjs/common';
import { SalaryComponentsService } from './salary-components.service';
import { SalaryComponentsController } from './salary-components.controller';
import { PrismaModule } from '../prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [SalaryComponentsController],
  providers: [SalaryComponentsService],
  exports: [SalaryComponentsService],
})
export class SalaryComponentsModule {}

