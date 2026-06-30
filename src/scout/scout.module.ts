import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { ScoutController } from './scout.controller';
import { ScoutService } from './scout.service';
import { ScoutMapService } from './scout-map.service';
import { ScoutAiService } from './scout-ai.service';

@Module({
  imports: [ClubModule],
  controllers: [ScoutController],
  providers: [ScoutService, ScoutMapService, ScoutAiService],
  exports: [ScoutService, ScoutMapService, ScoutAiService],
})
export class ScoutModule {}
