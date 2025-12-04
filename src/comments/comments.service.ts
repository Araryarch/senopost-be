import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(postId: string, dto: CreateCommentDto, authorId: string) {
    try {
      if (!dto.content) {
        throw new BadRequestException('Comment content is required');
      }

      if (!postId) {
        throw new BadRequestException('Post ID is required');
      }

      if (!authorId) {
        throw new BadRequestException('Author ID is required');
      }

      const comment = await this.prisma.comment.create({
        data: {
          content: dto.content,
          postId,
          parentId: dto.parentId ?? null,
          authorId,
        },
      });
      return comment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Post, parent comment, or author not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create comment');
    }
  }

  async findByPost(postId: string) {
    try {
      if (!postId) {
        throw new BadRequestException('Post ID is required');
      }

      const comments = await this.prisma.comment.findMany({ 
        where: { postId }, 
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author.username || comment.author.id,
        authorId: comment.authorId,
        postId: comment.postId,
        parentId: comment.parentId,
        score: comment.score,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      }));
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch comments');
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Comment ID is required');
      }

      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      return {
        id: comment.id,
        content: comment.content,
        author: comment.author.username || comment.author.id,
        authorId: comment.authorId,
        postId: comment.postId,
        parentId: comment.parentId,
        score: comment.score,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch comment');
    }
  }

  async update(id: string, dto: UpdateCommentDto) {
    try {
      if (!id) {
        throw new BadRequestException('Comment ID is required');
      }

      if (!dto.content) {
        throw new BadRequestException('Comment content is required');
      }

      return this.prisma.comment.update({ where: { id }, data: { content: dto.content } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Comment not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update comment');
    }
  }

  async remove(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Comment ID is required');
      }

      // Delete in transaction to ensure data consistency
      await this.prisma.$transaction(async (tx) => {
        // Recursively get all child comment IDs
        const getAllChildIds = async (parentId: string): Promise<string[]> => {
          const children = await tx.comment.findMany({
            where: { parentId },
            select: { id: true }
          });
          
          let allIds = children.map(c => c.id);
          for (const child of children) {
            const childIds = await getAllChildIds(child.id);
            allIds = allIds.concat(childIds);
          }
          return allIds;
        };

        const childIds = await getAllChildIds(id);
        const allCommentIds = [id, ...childIds];

        // Delete all votes on this comment and its children
        await tx.vote.deleteMany({
          where: {
            targetId: { in: allCommentIds },
            targetType: 'comment'
          }
        });

        // Delete all child comments first (bottom-up)
        if (childIds.length > 0) {
          await tx.comment.deleteMany({ where: { id: { in: childIds } } });
        }

        // Finally delete the parent comment
        await tx.comment.delete({ where: { id } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Comment not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting comment:', error);
      throw new InternalServerErrorException('Failed to delete comment');
    }
  }
}
