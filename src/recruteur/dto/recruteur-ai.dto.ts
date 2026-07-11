import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RecruteurAiSearchDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  query!: string;
}

export class RecruteurAiReportDto {
  @IsIn(['rep1', 'rep2', 'rep3', 'rep4'])
  templateId!: 'rep1' | 'rep2' | 'rep3' | 'rep4';

  @IsOptional()
  @IsIn(['pdf', 'excel', 'ppt'])
  format?: 'pdf' | 'excel' | 'ppt';
}
