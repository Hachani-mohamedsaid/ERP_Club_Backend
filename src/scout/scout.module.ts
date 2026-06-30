import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { ScoutController } from './scout.controller';
import { ScoutService } from './scout.service';

@Module({
  imports: [ClubModule],
  controllers: [ScoutController],
  providers: [ScoutService],
  exports: [ScoutService],
})
export class ScoutModule {}
