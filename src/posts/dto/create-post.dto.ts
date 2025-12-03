import { IsString, IsNotEmpty, IsOptional, IsUrl, IsBoolean } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  img?: string;

  @IsBoolean()
  @IsOptional()
  isNsfw?: boolean;

  @IsBoolean()
  @IsOptional()
  isSpoiler?: boolean;
}
