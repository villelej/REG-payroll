import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  company_id?: number;

  @ApiPropertyOptional({ description: 'If not provided, will be auto-generated (format: BR-A001, BR-A002, etc.)' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim?.() || '')
  branch_code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address_line1: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
