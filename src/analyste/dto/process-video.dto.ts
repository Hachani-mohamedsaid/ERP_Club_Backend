export class VideoFrameDto {
  timeSec!: number;
  imageBase64!: string;
}

export class ProcessVideoDto {
  playerName!: string;
  focus?: string;
  sport?: string;
  durationSec!: number;
  fileName?: string;
  frames!: VideoFrameDto[];
}
