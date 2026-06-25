import { Module } from '@nestjs/common';
import { AnalysteController } from './analyste.controller';
import { AnalysteService } from './analyste.service';

@Module({
  controllers: [AnalysteController],
  providers: [AnalysteService],
  exports: [AnalysteService],
})
export class AnalysteModule {}
