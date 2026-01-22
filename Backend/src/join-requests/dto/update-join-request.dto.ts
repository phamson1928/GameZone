import { PartialType } from '@nestjs/mapped-types';
import { CreateJoinRequestDto } from './create-join-request.dto';

export class UpdateJoinRequestDto extends PartialType(CreateJoinRequestDto) {}
