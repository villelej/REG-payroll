import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  company_code: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  company_email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  company_phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  country?: string;
}
