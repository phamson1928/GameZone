import { Injectable } from '@nestjs/common';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';

@Injectable()
export class ZonesService {
  create(_createZoneDto: CreateZoneDto): string {
    return 'This action adds a new zone';
  }

  findAll(): string {
    return `This action returns all zones`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} zone`;
  }

  update(id: number, _updateZoneDto: UpdateZoneDto): string {
    return `This action updates a #${id} zone`;
  }

  remove(id: number): string {
    return `This action removes a #${id} zone`;
  }
}
