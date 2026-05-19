import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { hr_users_role } from '@prisma/client';

export class CreateHrDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    enum: hr_users_role,
    required: false,
    default: hr_users_role.BranchHR,
  })
  @IsEnum(hr_users_role)
  @IsNotEmpty()
  role: hr_users_role;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  employeeId?: number;
}
