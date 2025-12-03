import { Controller, Get, Param, Patch, Delete, UseGuards, Req, Body, UnauthorizedException, HttpCode, HttpStatus, Post, Query, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FollowDto } from './dto/follow.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('users/search')
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Query('username') username: string) {
    if (!username) {
      throw new BadRequestException('Username query parameter is required');
    }
    return this.users.searchByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: Request & { user?: any }) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return this.users.findOne(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(@Req() req: Request & { user?: any }, @Body() dto: UpdateUserDto) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return this.users.update(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMe(@Req() req: Request & { user?: any }) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    await this.users.remove(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('followed')
  @HttpCode(HttpStatus.OK)
  async getFollowed(@Req() req: Request & { user?: any }) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return this.users.getFollowed(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow')
  @HttpCode(HttpStatus.CREATED)
  async follow(@Req() req: Request & { user?: any }, @Body() dto: FollowDto) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return this.users.follow(userId, dto.communityId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('follow')
  @HttpCode(HttpStatus.OK)
  async unfollow(@Req() req: Request & { user?: any }, @Body() dto: FollowDto) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return this.users.unfollow(userId, dto.communityId);
  }

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }
}
