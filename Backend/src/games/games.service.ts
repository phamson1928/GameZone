import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto.js';
import { UpdateGameDto } from './dto/update-game.dto.js';

@Injectable()
export class GamesService {
  create(_createGameDto: CreateGameDto): string {
    return 'This action adds a new game';
  }

  findAll(): string {
    return `This action returns all games`;
  }

  findOne(id: number): string {
    return `This action returns a #${id} game`;
  }

  update(id: number, _updateGameDto: UpdateGameDto): string {
    return `This action updates a #${id} game`;
  }

  remove(id: number): string {
    return `This action removes a #${id} game`;
  }
}
