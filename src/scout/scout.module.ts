import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { ApiFootballService } from './api-football/api-football.service';
import { ScoutFootballService } from './api-football/scout-football.service';
import { ScoutController } from './scout.controller';
import { ScoutService } from './scout.service';
import { ScoutMapService } from './scout-map.service';
import { ScoutAiService } from './scout-ai.service';
import { ScoutAgentsService } from './scout-agents.service';

@Module({
  imports: [ClubModule],
  controllers: [ScoutController],
  providers: [
    ScoutService,
    ScoutMapService,
    ScoutAiService,
    ScoutAgentsService,
    ApiFootballService,
    ScoutFootballService,
  ],
  exports: [ScoutService, ScoutMapService, ScoutAiService, ScoutAgentsService, ScoutFootballService],
})
export class ScoutModule {}
