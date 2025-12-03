import { Controller, Post, Body, UseGuards, Request, Param, Get, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
export class PostsController {
  constructor(private svc: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('communities/:cid/posts')
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('cid') cid: string, @Body() dto: CreatePostDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.svc.create(cid, dto, userId);
  }

  @Get('communities/:cid/posts')
  @HttpCode(HttpStatus.OK)
  async findByCommunity(@Param('cid') cid: string) {
    return this.svc.findByCommunity(cid);
  }

  @Get('user/:userId/posts')
  @HttpCode(HttpStatus.OK)
  async findByUser(@Param('userId') userId: string) {
    return this.svc.findByUser(userId);
  }

  @Patch('posts/:id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.svc.update(id, dto);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
  }
}
