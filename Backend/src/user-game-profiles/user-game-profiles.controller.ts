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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserGameProfilesService } from './user-game-profiles.service';
import { CreateUserGameProfileDto } from './dto/create-user-game-profile.dto';
import { UpdateUserGameProfileDto } from './dto/update-user-game-profile.dto';
import { CurrentUser, JwtAuthGuard } from '../common/index.js';

@ApiTags('User Game Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user-game-profiles')
export class UserGameProfilesController {
  constructor(
    private readonly userGameProfilesService: UserGameProfilesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a game profile for the current user' })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateUserGameProfileDto,
  ) {
    return this.userGameProfilesService.create(userId, dto);
  }

  // IMPORTANT: Static routes must come BEFORE dynamic routes (:id)
  @Get('me')
  @ApiOperation({ summary: 'Get all game profiles of the current user' })
  findMyProfiles(@CurrentUser('sub') userId: string) {
    return this.userGameProfilesService.findAllByMe(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific game profile' })
  findOne(@Param('id') id: string) {
    return this.userGameProfilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update rank level of a game profile' })
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserGameProfileDto,
  ) {
    return this.userGameProfilesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a game profile' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.userGameProfilesService.remove(userId, id);
  }
}
