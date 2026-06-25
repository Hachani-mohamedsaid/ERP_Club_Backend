import { IsString } from 'class-validator';

export class PredictMatchDto {
  @IsString()
  home!: string;

  @IsString()
  away!: string;
}
