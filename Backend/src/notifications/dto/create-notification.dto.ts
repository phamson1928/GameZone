import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType } from "@prisma/client";
import { IsEnum, IsObject, IsOptional } from "class-validator";
import { IsString } from "class-validator";

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, example: 'JOIN_REQUEST' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Có 1 request mới' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: { zoneId: '123', requestId: '456' } })
  @IsOptional()
  @IsObject()
  data?: any;
}
