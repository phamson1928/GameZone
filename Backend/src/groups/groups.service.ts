import { Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';

@Injectable()
export class GroupsService {
  create(_createGroupDto: CreateGroupDto): string {
    return 'This action adds a new group';
  }

  findAll(): string {
    return `This action returns all groups`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} group`;
  }

  update(id: number, _updateGroupDto: UpdateGroupDto): string {
    return `This action updates a #${id} group`;
  }

  remove(id: number): string {
    return `This action removes a #${id} group`;
  }
}
