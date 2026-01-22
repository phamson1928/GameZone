import { Injectable } from '@nestjs/common';
import { CreateJoinRequestDto } from './dto/create-join-request.dto.js';
import { UpdateJoinRequestDto } from './dto/update-join-request.dto.js';

@Injectable()
export class JoinRequestsService {
  create(_createJoinRequestDto: CreateJoinRequestDto): string {
    return 'This action adds a new joinRequest';
  }

  findAll(): string {
    return `This action returns all joinRequests`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} joinRequest`;
  }

  update(id: number, _updateJoinRequestDto: UpdateJoinRequestDto): string {
    return `This action updates a #${id} joinRequest`;
  }

  remove(id: number): string {
    return `This action removes a #${id} joinRequest`;
  }
}
