import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { ResponsableController } from './responsable.controller';
import { ResponsableService } from './responsable.service';

@Module({
  imports: [ClubModule],
  controllers: [ResponsableController],
  providers: [ResponsableService],
})
export class ResponsableModule {}
