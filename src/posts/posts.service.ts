import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(communityId: string, dto: CreatePostDto, authorId: string) {
    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        communityId,
        authorId,
      },
    });
    return post;
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findByCommunity(cid: string) {
    return this.prisma.post.findMany({ where: { communityId: cid }, orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdatePostDto) {
    return this.prisma.post.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.post.delete({ where: { id } });
  }
}
