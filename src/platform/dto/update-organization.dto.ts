import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrganizationStatus } from '@prisma/client';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  clubName?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  league?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @IsOptional()
  @IsString()
  planCode?: string;
}
