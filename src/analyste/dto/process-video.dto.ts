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

  @IsOptional()
  @IsNumber()
  @Min(0)
  motionScore?: number;
}

export class PoseFrameDto {
  @IsNumber()
  @Min(0)
  timeSec!: number;

  @IsNumber()
  leftKnee!: number;

  @IsNumber()
  rightKnee!: number;

  @IsOptional()
  @IsNumber()
  leftHip?: number;

  @IsOptional()
  @IsNumber()
  rightHip?: number;

  @IsString()
  leftLegPhase!: string;

  @IsString()
  rightLegPhase!: string;

  @IsString()
  footStrike!: string;

  @IsNumber()
  powerIndex!: number;

  @IsOptional()
  @IsNumber()
  symmetryIndex?: number;

  @IsOptional()
  @IsNumber()
  trunkTilt?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];
}

export class PoseSummaryDto {
  @IsNumber()
  detectionRate!: number;

  @IsNumber()
  avgLeftKnee!: number;

  @IsNumber()
  avgRightKnee!: number;

  @IsNumber()
  avgSymmetry!: number;

  @IsNumber()
  avgPowerIndex!: number;

  @IsString()
  dominantFoot!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  legInsights?: string[];
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

  @IsOptional()
  @ValidateNested()
  @Type(() => PoseSummaryDto)
  poseSummary?: PoseSummaryDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => PoseFrameDto)
  poseFrames?: PoseFrameDto[];
}
