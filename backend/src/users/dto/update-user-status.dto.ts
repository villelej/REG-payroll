import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty()
  @IsInt()
  userId: number;

  @ApiProperty({ enum: ['ACTIVE', 'BLOCKED', 'LOCKED', 'PENDING', 'APPROVE_PENDING', 'REJECT_PENDING'] })
  @IsString()
  @IsIn(['ACTIVE', 'BLOCKED', 'LOCKED', 'PENDING', 'APPROVE_PENDING', 'REJECT_PENDING'])
  status: 'ACTIVE' | 'BLOCKED' | 'LOCKED' | 'PENDING' | 'APPROVE_PENDING' | 'REJECT_PENDING';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
