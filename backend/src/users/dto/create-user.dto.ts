import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  national_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiPropertyOptional({ default: 'Reg@12345' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: ['SuperAdmin', 'BranchHR', 'Employee'] })
  @IsString()
  @IsIn(['SuperAdmin', 'BranchHR', 'Employee'])
  role: 'SuperAdmin' | 'BranchHR' | 'Employee';

  @ApiProperty({ enum: ['ACTIVE', 'BLOCKED', 'LOCKED', 'PENDING'] })
  @IsString()
  @IsIn(['ACTIVE', 'BLOCKED', 'LOCKED', 'PENDING'])
  status: 'ACTIVE' | 'BLOCKED' | 'LOCKED' | 'PENDING';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contract_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  education_level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_of_birth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contract_start?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contract_end?: string;
}
