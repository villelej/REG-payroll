import { Module } from '@nestjs/common';
import { BranchDeductionsController } from './branch-deductions.controller';
import { BranchDeductionsService } from './branch-deductions.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BranchDeductionsController],
  providers: [BranchDeductionsService],
  exports: [BranchDeductionsService]
})
export class BranchDeductionsModule {}
