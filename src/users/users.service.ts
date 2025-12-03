import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
          nsfwEnabled: true,
          spoilerEnabled: true,
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
      if (dto.nsfwEnabled !== undefined) data.nsfwEnabled = dto.nsfwEnabled;
      if (dto.spoilerEnabled !== undefined) data.spoilerEnabled = dto.spoilerEnabled;

      const user = await this.prisma.user.update({ where: { id }, data, select: { id: true, email: true, username: true, photo: true, nsfwEnabled: true, spoilerEnabled: true } });
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

      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async getFollowed(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const follows = await this.prisma.follow.findMany({
        where: { userId },
        select: {
          targetId: true,
          targetType: true,
          createdAt: true
        }
      });

      // Separate user and community follows
      const userFollows = follows.filter(f => f.targetType === 'user');
      const communityFollows = follows.filter(f => f.targetType === 'community');

      // Fetch details for followed users
      const followedUsers = await this.prisma.user.findMany({
        where: { id: { in: userFollows.map(f => f.targetId) } },
        select: { id: true, username: true, photo: true }
      });

      // Fetch details for followed communities
      const followedCommunities = await this.prisma.community.findMany({
        where: { id: { in: communityFollows.map(f => f.targetId) } },
        select: { id: true, name: true, description: true }
      });

      return {
        users: followedUsers,
        communities: followedCommunities
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch followed items');
    }
  }

  async follow(userId: string, targetId: string, targetType: 'user' | 'community') {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!targetId) {
        throw new BadRequestException('Target ID is required');
      }

      if (userId === targetId && targetType === 'user') {
        throw new BadRequestException('Cannot follow yourself');
      }

      // Verify target exists
      if (targetType === 'user') {
        const targetUser = await this.prisma.user.findUnique({ where: { id: targetId } });
        if (!targetUser) throw new NotFoundException('User not found');
      } else {
        const targetCommunity = await this.prisma.community.findUnique({ where: { id: targetId } });
        if (!targetCommunity) throw new NotFoundException('Community not found');
      }

      const follow = await this.prisma.follow.create({
        data: {
          userId,
          targetId,
          targetType
        }
      });

      return { message: 'Successfully followed', follow };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Already following');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('User not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to follow');
    }
  }

  async unfollow(userId: string, targetId: string, targetType: 'user' | 'community') {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      if (!targetId) {
        throw new BadRequestException('Target ID is required');
      }

      await this.prisma.follow.delete({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId,
            targetType
          }
        }
      });

      return { message: 'Successfully unfollowed' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Follow relationship not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unfollow');
    }
  }
}
