import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

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
