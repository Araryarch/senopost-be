import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VoteDto } from './dto/vote.dto';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  private async upsertVote(userId: string, targetId: string, targetType: 'post' | 'comment', value: number) {
    const existing = await this.prisma.vote.findUnique({ where: { userId_targetId_targetType: { userId, targetId, targetType } } as any });

    if (!existing) {
      await this.prisma.vote.create({ data: { userId, targetId, targetType, value } });
    } else {
      await this.prisma.vote.update({ where: { userId_targetId_targetType: { userId, targetId, targetType } } as any, data: { value } });
    }

    const agg = await this.prisma.vote.aggregate({ where: { targetId, targetType }, _sum: { value: true } });
    const score = agg._sum.value ?? 0;

    if (targetType === 'post') {
      await this.prisma.post.update({ where: { id: targetId }, data: { score } });
      return { post_id: targetId, score };
    }

    await this.prisma.comment.update({ where: { id: targetId }, data: { score } });
    return { comment_id: targetId, score };
  }

  async votePost(postId: string, userId: string, dto: VoteDto) {
    return this.upsertVote(userId, postId, 'post', dto.value);
  }

  async voteComment(commentId: string, userId: string, dto: VoteDto) {
    return this.upsertVote(userId, commentId, 'comment', dto.value);
  }
}
