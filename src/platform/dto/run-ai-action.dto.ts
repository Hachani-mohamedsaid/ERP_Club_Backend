import { IsIn, IsOptional, IsString } from 'class-validator';

export class RunAiActionDto {
  @IsIn(['performance', 'monthly_report', 'anomaly'])
  actionId!: 'performance' | 'monthly_report' | 'anomaly';

  @IsOptional()
  @IsString()
  prompt?: string;
}
