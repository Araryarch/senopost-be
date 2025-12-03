import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class FollowDto {
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsEnum(['user', 'community'])
  @IsNotEmpty()
  targetType: 'user' | 'community';
}
