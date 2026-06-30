import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ClubAiChatDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  context?: string;
}
