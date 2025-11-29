import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommunityDto, creatorId: string) {
    const community = await this.prisma.community.create({
      data: {
        name: dto.name,
        description: dto.description,
        creatorId,
      },
    });
    return community;
  }

  async findOne(id: string) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async update(id: string, dto: UpdateCommunityDto) {
    return this.prisma.community.update({ where: { id }, data: { description: dto.description } });
  }

  async remove(id: string) {
    await this.prisma.community.delete({ where: { id } });
  }

  async postsForCommunity(cid: string) {
    return this.prisma.post.findMany({ where: { communityId: cid }, select: { id: true, title: true, score: true } });
  }
}
