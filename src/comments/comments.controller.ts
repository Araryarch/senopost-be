import { Controller, Post, Body, UseGuards, Request, Param, Get, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller()
export class CommentsController {
  constructor(private svc: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts/:pid/comments')
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('pid') pid: string, @Body() dto: CreateCommentDto, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.svc.create(pid, dto, userId);
  }

  @Get('posts/:pid/comments')
  @HttpCode(HttpStatus.OK)
  async findByPost(@Param('pid') pid: string) {
    return this.svc.findByPost(pid);
  }

  @Get('comments/:id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch('comments/:id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.svc.update(id, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
  }
}
