import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ZoneSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PLAYERS_ASC = 'players_asc',
  PLAYERS_DESC = 'players_desc',
}

export class SearchZonesDto {
  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề hoặc mô tả' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID Game (UUID)' })
  @IsOptional()
  @IsUUID()
  gameId?: string;

  @ApiPropertyOptional({
    enum: ZoneSortBy,
    default: ZoneSortBy.NEWEST,
    description: 'Sắp xếp'
  })
  @IsOptional()
  @IsEnum(ZoneSortBy)
  sortBy?: ZoneSortBy = ZoneSortBy.NEWEST;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
