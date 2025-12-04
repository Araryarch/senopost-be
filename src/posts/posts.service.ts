import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const posts = await this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          community: {
            select: {
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
        },
      });

      return posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        img: post.img || null,
        isNsfw: post.isNsfw || false,
        isSpoiler: post.isSpoiler || false,
        communityId: post.communityId,
        community: post.community?.name || 'Unknown',
        author: post.author?.username || post.author?.id || 'Unknown',
        upvotes: post.score || 0,
        commentCount: post.comments?.length || 0,
        timeAgo: this.getTimeAgo(post.updatedAt),
      }));
    } catch (error) {
      console.error('Error in findAll:', error);
      console.error('Error stack:', error.stack);
      throw new InternalServerErrorException('Failed to fetch all posts');
    }
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }

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

      const post = await this.prisma.post.findUnique({ 
        where: { id },
        include: {
          community: {
            select: {
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          comments: {
            where: {
              parentId: null, // Only top lvl cmmnt
            },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                },
              },
              children: {
                include: {
                  author: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                  children: {
                    include: {
                      author: {
                        select: {
                          id: true,
                          username: true,
                        },
                      },
                      children: {
                        include: {
                          author: {
                            select: {
                              id: true,
                              username: true,
                            },
                          },
                          children: true, // deeper nest
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
      
      if (!post) throw new NotFoundException('Post not found');
      
      // Transform response to match expected format
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.img,
        community: post.community.name,
        author: post.author.username || post.author.id,
        upvotes: post.score,
        commentCount: this.countAllComments(post.comments),
        timeAgo: this.getTimeAgo(post.updatedAt),
        comments: post.comments.map((comment) => this.formatComment(comment)),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch post');
    }
  }

  private formatComment(comment: any): any {
    return {
      id: comment.id,
      author: comment.author.username || comment.author.id,
      content: comment.content,
      upvotes: comment.score,
      timeAgo: this.getTimeAgo(comment.updatedAt),
      replies: comment.children ? comment.children.map((child: any) => this.formatComment(child)) : [],
    };
  }

  private countAllComments(comments: any[]): number {
    let count = comments.length;
    for (const comment of comments) {
      if (comment.children && comment.children.length > 0) {
        count += this.countAllComments(comment.children);
      }
    }
    return count;
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

      // Delete in transaction to ensure data consistency
      await this.prisma.$transaction(async (tx) => {
        // Get all comment IDs for this post
        const comments = await tx.comment.findMany({ 
          where: { postId: id },
          select: { id: true }
        });
        const commentIds = comments.map(c => c.id);

        // Delete votes on comments
        if (commentIds.length > 0) {
          await tx.vote.deleteMany({
            where: {
              targetId: { in: commentIds },
              targetType: 'comment'
            }
          });
        }

        // Delete votes on the post
        await tx.vote.deleteMany({
          where: {
            targetId: id,
            targetType: 'post'
          }
        });

        // Delete all comments for this post
        if (commentIds.length > 0) {
          await tx.comment.deleteMany({ where: { postId: id } });
        }

        // Finally delete the post
        await tx.post.delete({ where: { id } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Post not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting post:', error);
      throw new InternalServerErrorException('Failed to delete post');
    }
  }
}
