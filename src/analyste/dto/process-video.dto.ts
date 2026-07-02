import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class VideoFrameDto {
  @IsNumber()
  @Min(0)
  timeSec!: number;

  @IsString()
  imageBase64!: string;
}

export class ProcessVideoDto {
  @IsString()
  playerName!: string;

  @IsOptional()
  @IsString()
  focus?: string;

  @IsOptional()
  @IsString()
  sport?: string;

  @IsNumber()
  @Min(0)
  durationSec!: number;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => VideoFrameDto)
  frames!: VideoFrameDto[];
}
