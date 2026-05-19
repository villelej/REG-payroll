import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsDecimal,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { employees_gender } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ enum: employees_gender })
  @IsEnum(employees_gender)
  @IsNotEmpty()
  gender: employees_gender;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankAccount: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  branchId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  departmentId: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  postId: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  employeeCode?: string;

  @ApiProperty()
  @IsNotEmpty()
  baseSalary: number;
}
