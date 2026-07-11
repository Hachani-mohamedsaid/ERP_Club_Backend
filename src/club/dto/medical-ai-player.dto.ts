import { IsString, MaxLength } from 'class-validator';

export class MedicalAiPlayerDto {
  @IsString()
  @MaxLength(64)
  playerId!: string;
}
