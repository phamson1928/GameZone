import { RankLevel, ContactMethodType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ZoneContactDto {
  @IsEnum(ContactMethodType)
  type: ContactMethodType = ContactMethodType.INGAME;

  @IsString()
  @IsNotEmpty()
  value: string = '';
}

export class CreateZoneDto {
  @IsNotEmpty()
  @IsString()
  gameId: string = '';

  @IsString()
  description: string = '';

  @IsString()
  title: string = '';

  @IsOptional()
  @IsUUID(4, { each: true })
  tagIds?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ZoneContactDto)
  contacts?: ZoneContactDto[];

  @IsEnum(RankLevel)
  minRankLevel: RankLevel = 'BEGINNER';

  @IsEnum(RankLevel)
  maxRankLevel: RankLevel = 'PRO';

  @IsNotEmpty()
  @IsInt()
  requiredPlayers: number = 1;
}
