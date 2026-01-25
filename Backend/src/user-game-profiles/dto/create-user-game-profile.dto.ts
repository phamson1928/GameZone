import { ApiProperty } from '@nestjs/swagger';
import { RankLevel } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateUserGameProfileDto {
  @ApiProperty({ example: 'game-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  gameId: string;

  @ApiProperty({ enum: RankLevel, example: RankLevel.BEGINNER })
  @IsEnum(RankLevel)
  @IsNotEmpty()
  rankLevel: RankLevel;
}
