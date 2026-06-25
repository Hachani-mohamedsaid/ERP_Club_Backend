import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreatePlatformUserDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  clubRole?: string;
}
