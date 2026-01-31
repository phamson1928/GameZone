import { RankLevel } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateZoneDto {
  @IsNotEmpty()
  @IsString()
  gameId: string;

  @IsString()
  description: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsUUID(4, { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString({ each: true })
  contactValue?: string[];

  @IsEnum(RankLevel)
  minRankLevel: RankLevel;

  @IsEnum(RankLevel)
  maxRankLevel: RankLevel;

  @IsNotEmpty()
  @IsInt()
  requiredPlayers: number;
}
