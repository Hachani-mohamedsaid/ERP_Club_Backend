import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  clubName!: string;

  @IsString()
  country!: string;

  @IsString()
  league!: string;

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
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  planCode?: string;
}
