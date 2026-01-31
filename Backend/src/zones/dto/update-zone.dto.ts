import { PartialType } from '@nestjs/mapped-types';
import { CreateZoneDto } from './create-zone.dto.js';
import { IsEnum, IsOptional } from 'class-validator';
import { ZoneStatus } from '@prisma/client';

export class UpdateZoneDto extends PartialType(CreateZoneDto) {
  @IsOptional()
  @IsEnum(ZoneStatus)
  status?: ZoneStatus;
}
