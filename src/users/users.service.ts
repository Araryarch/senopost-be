import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async searchByUsername(username: string) {
    try {
      if (!username) {
        throw new BadRequestException('Username query is required');
      }

      const users = await this.prisma.user.findMany({
        where: {
          username: {
            contains: username,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          username: true,
          photo: true,
          bio: true,
        },
        take: 20, // Limit results
      });

      return users;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search users');
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('User ID is required');
      }

      const user = await this.prisma.user.findUnique({ 
        where: { id }, 
        select: { 
          id: true, 
          email: true, 
          username: true, 
          photo: true,
          bio: true,
          nsfwEnabled: true,
          spoilerEnabled: true,
          linkX: true,
          linkGithub: true,
          linkWebsite: true,
          linkInstagram: true,
          posts: {
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
            },
            orderBy: { createdAt: 'desc' }
          }
        } 
      });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      if (!id) {
        throw new BadRequestException('User ID is required');
      }

      const data: any = {};
      if (dto.email) data.email = dto.email;
      if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
      if (dto.username !== undefined) data.username = dto.username;
      if (dto.photo !== undefined) data.photo = dto.photo;
      if (dto.bio !== undefined) data.bio = dto.bio;
      if (dto.nsfwEnabled !== undefined) data.nsfwEnabled = dto.nsfwEnabled;
      if (dto.spoilerEnabled !== undefined) data.spoilerEnabled = dto.spoilerEnabled;
      if (dto.linkX !== undefined) data.linkX = dto.linkX;
      if (dto.linkGithub !== undefined) data.linkGithub = dto.linkGithub;
      if (dto.linkWebsite !== undefined) data.linkWebsite = dto.linkWebsite;
      if (dto.linkInstagram !== undefined) data.linkInstagram = dto.linkInstagram;

      const user = await this.prisma.user.update({ where: { id }, data, select: { id: true, email: true, username: true, photo: true, bio: true, nsfwEnabled: true, spoilerEnabled: true, linkX: true, linkGithub: true, linkWebsite: true, linkInstagram: true } });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('User ID is required');
      }

      // Delete in transaction to ensure data consistency
      await this.prisma.$transaction(async (tx) => {
        // Delete all votes by this user
        await tx.vote.deleteMany({ where: { userId: id } });

        // Delete all follows by this user
        await tx.follow.deleteMany({ where: { userId: id } });

        // Get all posts by this user
        const posts = await tx.post.findMany({ 
          where: { authorId: id },
          select: { id: true }
        });
        const postIds = posts.map(p => p.id);

        if (postIds.length > 0) {
          // Get all comments on user's posts
          const comments = await tx.comment.findMany({ 
            where: { postId: { in: postIds } },
            select: { id: true }
          });
          const commentIds = comments.map(c => c.id);

          // Delete votes on user's posts
          await tx.vote.deleteMany({
            where: {
              targetId: { in: postIds },
              targetType: 'post'
            }
          });

          // Delete votes on comments
          if (commentIds.length > 0) {
            await tx.vote.deleteMany({
              where: {
                targetId: { in: commentIds },
                targetType: 'comment'
              }
            });

            // Delete comments on user's posts
            await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
          }
        }

        // Delete all comments by this user
        await tx.comment.deleteMany({ where: { authorId: id } });

        // Delete all posts by this user
        await tx.post.deleteMany({ where: { authorId: id } });

        // Get user's communities
        const communities = await tx.community.findMany({ 
          where: { authorId: id },
          select: { id: true }
        });

        // Delete follows for user's communities
        if (communities.length > 0) {
          await tx.follow.deleteMany({ 
            where: { 
              targetId: { in: communities.map(c => c.id) },
              targetType: 'community'
            } 
          });
        }

        // Delete all communities by this user
        await tx.community.deleteMany({ where: { authorId: id } });

        // Finally delete the user
        await tx.user.delete({ where: { id } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting user:', error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async getFollowed(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const follows = await this.prisma.follow.findMany({
        where: { 
          userId,
          targetType: 'community'
        },
        select: {
          targetId: true,
          createdAt: true
        }
      });

      // Fetch details for followed communities
      const followedCommunities = await this.prisma.community.findMany({
        where: { id: { in: follows.map(f => f.targetId) } },
        select: { id: true, name: true, description: true }
      });

      return followedCommunities;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch followed communities');
    }
  }

  async follow(userId: string, communityId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!communityId) {
        throw new BadRequestException('Community ID is required');
      }

      // community exist???
      const targetCommunity = await this.prisma.community.findUnique({ where: { id: communityId } });
      if (!targetCommunity) throw new NotFoundException('Community not found');

      const follow = await this.prisma.follow.create({
        data: {
          userId,
          targetId: communityId,
          targetType: 'community'
        }
      });

      return { message: 'Successfully followed community', follow };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Already following this community');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('User not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to follow community');
    }
  }

  async unfollow(userId: string, communityId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!communityId) {
        throw new BadRequestException('Community ID is required');
      }

      await this.prisma.follow.delete({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: communityId,
            targetType: 'community'
          }
        }
      });

      return { message: 'Successfully unfollowed community' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Not following this community');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unfollow community');
    }
  }
}
