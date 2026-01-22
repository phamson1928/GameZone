import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';

@Injectable()
export class ReportsService {
  create(_createReportDto: CreateReportDto): string {
    return 'This action adds a new report';
  }

  findAll(): string {
    return `This action returns all reports`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} report`;
  }

  update(id: number, _updateReportDto: UpdateReportDto): string {
    return `This action updates a #${id} report`;
  }

  remove(id: number): string {
    return `This action removes a #${id} report`;
  }
}
