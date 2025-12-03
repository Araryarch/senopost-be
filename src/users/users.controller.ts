import { Controller, Get, Param, Patch, Delete, UseGuards, Req, Body, UnauthorizedException, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FollowDto } from './dto/follow.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
export class UsersController {
  constructor(private users: UsersService) {}

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
    return this.users.follow(userId, dto.targetId, dto.targetType);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('follow')
  @HttpCode(HttpStatus.OK)
  async unfollow(@Req() req: Request & { user?: any }, @Body() dto: FollowDto) {
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return this.users.unfollow(userId, dto.targetId, dto.targetType);
  }

  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }
}
