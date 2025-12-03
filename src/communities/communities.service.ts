import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const communities = await this.prisma.community.findMany({
        include: {
          author: {
            select: {
              username: true,
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      // Get follower counts for all communities
      const followerCounts = await Promise.all(
        communities.map(async (community) => {
          const count = await this.prisma.follow.count({
            where: {
              targetId: community.id,
              targetType: 'community',
            },
          });
          return { id: community.id, count };
        })
      );

      const followerMap = new Map(followerCounts.map((fc) => [fc.id, fc.count]));

      return communities.map((community) => ({
        id: community.id,
        name: community.name,
        description: community.description,
        author: community.author?.username || 'Unknown',
        followerCount: followerMap.get(community.id) || 0,
        createdAt: community.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching communities:', error);
      throw new InternalServerErrorException('Failed to fetch communities');
    }
  }

  async create(dto: CreateCommunityDto, creatorId: string) {
    try {
      if (!dto.name) {
        throw new BadRequestException('Community name is required');
      }

      if (!creatorId) {
        throw new BadRequestException('Creator ID is required');
      }

      const community = await this.prisma.community.create({
        data: {
          name: dto.name,
          description: dto.description,
          authorId: creatorId,
        },
      });
      return community;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Community name already exists');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Creator user not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create community');
    }
  }

  async findOne(id: string) {
    try {
      if (!id) {
        throw new BadRequestException('Community ID is required');
      }

      const community = await this.prisma.community.findUnique({ 
        where: { id },
        include: {
          author: {
            select: {
              username: true,
            },
          },
        },
      });
      if (!community) throw new NotFoundException('Community not found');
      
      // Get follower count
      const followerCount = await this.prisma.follow.count({
        where: {
          targetId: id,
          targetType: 'community',
        },
      });

      return {
        id: community.id,
        name: community.name,
        description: community.description,
        author: community.author?.username || 'Unknown',
        followerCount,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt,
      };
    } catch (error) {
      console.error('Error fetching community:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch community');
    }
  }

  async update(id: string, dto: UpdateCommunityDto) {
    try {
      if (!id) {
        throw new BadRequestException('Community ID is required');
      }

      return this.prisma.community.update({ where: { id }, data: { description: dto.description } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Community not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update community');
    }
  }

  async remove(id: string, userId: string) {
    try {
      if (!id) {
        throw new BadRequestException('Community ID is required');
      }

      // Check if the community exists and if the user is the author
      const community = await this.prisma.community.findUnique({ where: { id } });
      if (!community) {
        throw new NotFoundException('Community not found');
      }

      if (community.authorId !== userId) {
        throw new BadRequestException('Only the author can delete this community');
      }

      await this.prisma.community.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Community not found');
        }
      }
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete community');
    }
  }

  async postsForCommunity(cid: string) {
    try {
      if (!cid) {
        throw new BadRequestException('Community ID is required');
      }

      // Get follower count
      const followerCount = await this.prisma.follow.count({
        where: {
          targetId: cid,
          targetType: 'community',
        },
      });

      const posts = await this.prisma.post.findMany({ 
        where: { communityId: cid }, 
        select: { 
          id: true, 
          title: true, 
          score: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        followerCount,
        posts,
      };
    } catch (error) {
      console.error('Error fetching community posts:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch community posts');
    }
  }
}
