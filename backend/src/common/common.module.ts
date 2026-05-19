import { Module } from '@nestjs/common';
import { CodeGeneratorService } from './services/code-generator.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CodeGeneratorService],
  exports: [CodeGeneratorService],
})
export class CommonModule {}
