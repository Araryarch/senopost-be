import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(postId: string, dto: CreateCommentDto, authorId: string) {
    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        parentId: dto.parentId ?? null,
        authorId,
      },
    });
    return comment;
  }

  async findByPost(postId: string) {
    return this.prisma.comment.findMany({ where: { postId }, orderBy: { createdAt: 'asc' } });
  }

  async update(id: string, dto: UpdateCommentDto) {
    return this.prisma.comment.update({ where: { id }, data: { content: dto.content } });
  }

  async remove(id: string) {
    await this.prisma.comment.delete({ where: { id } });
  }
}
