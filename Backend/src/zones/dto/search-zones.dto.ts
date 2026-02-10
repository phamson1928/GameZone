import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ZoneSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PLAYERS_ASC = 'players_asc',
  PLAYERS_DESC = 'players_desc',
}

export class SearchZonesDto {
  @IsOptional()
  @IsString()
  q?: string; // Search query for title, description

  @IsOptional()
  @IsEnum(ZoneSortBy)
  sortBy?: ZoneSortBy = ZoneSortBy.NEWEST;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
