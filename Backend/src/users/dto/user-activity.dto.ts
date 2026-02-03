import { ApiProperty } from '@nestjs/swagger';

export class UserActivityDto {
  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity description' })
  description: string;

  @ApiProperty({ description: 'Activity timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Related entity ID', required: false })
  relatedId?: string;

  @ApiProperty({ description: 'Related entity type', required: false })
  relatedType?: string;
}
