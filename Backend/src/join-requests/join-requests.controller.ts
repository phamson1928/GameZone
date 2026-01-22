import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JoinRequestsService } from './join-requests.service';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { UpdateJoinRequestDto } from './dto/update-join-request.dto';

@Controller('join-requests')
export class JoinRequestsController {
  constructor(private readonly joinRequestsService: JoinRequestsService) {}

  @Post()
  create(@Body() createJoinRequestDto: CreateJoinRequestDto) {
    return this.joinRequestsService.create(createJoinRequestDto);
  }

  @Get()
  findAll() {
    return this.joinRequestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.joinRequestsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJoinRequestDto: UpdateJoinRequestDto,
  ) {
    return this.joinRequestsService.update(+id, updateJoinRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.joinRequestsService.remove(+id);
  }
}
