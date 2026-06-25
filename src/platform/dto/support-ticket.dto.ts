import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { SupportTicketPriority, SupportTicketStatus } from '@prisma/client';

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(3)
  clubName!: string;

  @IsString()
  @MinLength(5)
  subject!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsString()
  agentName?: string;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}
