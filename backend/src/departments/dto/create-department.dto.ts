import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  company_id: number;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  branch_id?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  department_code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  department_name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
