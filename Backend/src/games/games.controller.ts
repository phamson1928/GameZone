import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, Roles, RolesGuard } from 'src/common';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new game (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The game has been successfully created.',
  })
  create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all games for administration (Admin only)' })
  findAllForAdmin() {
    return this.gamesService.findAllForAdmin();
  }

  @Get('user')
  @Public()
  @ApiOperation({ summary: 'Get list of active games for users' })
  findAllForUser() {
    return this.gamesService.findAllForUser();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a specific game by ID' })
  @ApiResponse({ status: 200, description: 'Returns the game details.' })
  @ApiResponse({ status: 404, description: 'Game not found.' })
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a game (Admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateGameDto) {
    return this.gamesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a game (Admin only)' })
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
