import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class RecordPaymentDto {
  @IsString()
  organizationId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
