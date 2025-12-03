import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(communityId: string, dto: CreatePostDto, authorId: string) {
    try {
      if (!dto.title) {
        throw new BadRequestException('Post title is required');
      }

      if (!communityId) {
        throw new BadRequestException('Community ID is required');
      }

      if (!authorId) {
        throw new BadRequestException('Author ID is required');
      }

      const post = await this.prisma.post.create({
        data: {
          title: dto.title,
          content: dto.content,
          img: dto.img,
          isNsfw: dto.isNsfw || false,
          isSpoiler: dto.isSpoiler || false,
          communityId,
          authorId,
        },
      });
      return post;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Community or author not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create post');
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Post ID is required');
      }

      const post = await this.prisma.post.findUnique({ where: { id } });
      if (!post) throw new NotFoundException('Post not found');
      return post;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch post');
    }
  }

  async findByCommunity(cid: string) {
    try {
      if (!cid) {
        throw new BadRequestException('Community ID is required');
      }

      return this.prisma.post.findMany({ where: { communityId: cid }, orderBy: { createdAt: 'desc' } });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch posts');
    }
  }

  async findByUser(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      return this.prisma.post.findMany({ 
        where: { authorId: userId }, 
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          img: true,
          isNsfw: true,
          isSpoiler: true,
          score: true,
          createdAt: true,
          communityId: true
        }
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user posts');
    }
  }

  async update(id: string, dto: UpdatePostDto) {
    try {
      if (!id) {
        throw new BadRequestException('Post ID is required');
      }

      return this.prisma.post.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Post not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update post');
    }
  }

  async remove(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Post ID is required');
      }

      await this.prisma.post.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Post not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete post');
    }
  }
}
