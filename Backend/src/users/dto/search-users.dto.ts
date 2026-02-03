import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUsersDto {
  @ApiPropertyOptional({ description: 'Search by email or username' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: ['ADMIN', 'USER'],
  })
  @IsOptional()
  @IsEnum(['ADMIN', 'USER'])
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['ACTIVE', 'BANNED'],
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'BANNED'])
  status?: string;
}
