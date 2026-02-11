import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from 'src/prisma';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async getAllTags() {
    const tags = await this.prisma.zoneTag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return tags;
  }

  async createTag(createTagDto: CreateTagDto) {
    const newTag = await this.prisma.zoneTag.create({
      data: { ...createTagDto },
    });
    return newTag;
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto) {
    const updatedTag = await this.prisma.zoneTag.update({
      where: { id },
      data: { ...updateTagDto },
    });
    return updatedTag;
  }

  async deleteTag(id: string) {
    await this.prisma.zoneTag.delete({
      where: { id },
    });
    return { message: 'Tag deleted successfully' };
  }
}
