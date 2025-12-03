import { IsEmail, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsBoolean()
  @IsOptional()
  nsfwEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  spoilerEnabled?: boolean;
}
