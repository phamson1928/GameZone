import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Files')
@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Post('upload/game-icon')
    @Public() // For testing, you might want to add Auth guard later
    @ApiOperation({ summary: 'Upload game icon' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadGameIcon(@UploadedFile() file: Express.Multer.File) {
        return this.filesService.uploadFile(file, 'game-assets', 'icons');
    }

    @Post('upload/game-banner')
    @Public()
    @ApiOperation({ summary: 'Upload game banner' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadGameBanner(@UploadedFile() file: Express.Multer.File) {
        return this.filesService.uploadFile(file, 'game-assets', 'banners');
    }

    @Post('upload/avatar')
    @Public()
    @ApiOperation({ summary: 'Upload user avatar' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
        // Note: In real app, we should use the userId as part of the path
        return this.filesService.uploadFile(file, 'game-assets', 'avatars');
    }
}
