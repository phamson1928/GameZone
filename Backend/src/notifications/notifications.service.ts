import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto.js';
import { UpdateNotificationDto } from './dto/update-notification.dto.js';

@Injectable()
export class NotificationsService {
  create(_createNotificationDto: CreateNotificationDto): string {
    return 'This action adds a new notification';
  }

  findAll(): string {
    return `This action returns all notifications`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} notification`;
  }

  update(id: number, _updateNotificationDto: UpdateNotificationDto): string {
    return `This action updates a #${id} notification`;
  }

  remove(id: number): string {
    return `This action removes a #${id} notification`;
  }
}
