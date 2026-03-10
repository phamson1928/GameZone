import { Controller, Post, Delete, Get, Param, UseGuards, Request } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('blocks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blocks')
export class BlocksController {
    constructor(private readonly blocksService: BlocksService) { }

    @Post(':id')
    @ApiOperation({ summary: 'Block a user' })
    block(@Request() req, @Param('id') blockedId: string) {
        return this.blocksService.blockUser(req.user.sub, blockedId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Unblock a user' })
    unblock(@Request() req, @Param('id') blockedId: string) {
        return this.blocksService.unblockUser(req.user.sub, blockedId);
    }

    @Get()
    @ApiOperation({ summary: 'Get list of blocked users' })
    getBlocks(@Request() req) {
        return this.blocksService.getMyBlockedUsers(req.user.sub);
    }
}
