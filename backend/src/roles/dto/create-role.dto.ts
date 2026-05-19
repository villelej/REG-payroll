import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role_name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;
}
