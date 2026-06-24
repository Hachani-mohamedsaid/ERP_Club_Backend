import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterOrganizationDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  clubName!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  league!: string;

  @IsEmail()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsOptional()
  @IsString()
  invitationCode?: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  acceptTerms!: boolean;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  acceptPrivacy!: boolean;
}
