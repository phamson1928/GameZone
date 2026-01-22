import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { UpdateAuthDto } from './dto/update-auth.dto.js';

@Injectable()
export class AuthService {
  create(_createAuthDto: CreateAuthDto): string {
    return 'This action adds a new auth';
  }

  findAll(): string {
    return `This action returns all auth`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} auth`;
  }

  update(id: number, _updateAuthDto: UpdateAuthDto): string {
    return `This action updates a #${id} auth`;
  }

  remove(id: number): string {
    return `This action removes a #${id} auth`;
  }
}
