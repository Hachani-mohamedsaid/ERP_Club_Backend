import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { AnalysteController } from './analyste.controller';
import { AnalysteService } from './analyste.service';
import { AnalysteVideoAiService } from './analyste-video-ai.service';

@Module({
  imports: [ClubModule],
  controllers: [AnalysteController],
  providers: [AnalysteService, AnalysteVideoAiService],
  exports: [AnalysteService],
})
export class AnalysteModule {}
