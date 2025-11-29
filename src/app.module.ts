import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CommunitiesModule } from './communities/communities.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CommunitiesModule, PostsModule, CommentsModule, VotesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
