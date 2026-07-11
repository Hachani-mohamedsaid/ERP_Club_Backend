import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoueurAiChatDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  question!: string;
}
