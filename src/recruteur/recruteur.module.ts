import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { ScoutModule } from '../scout/scout.module';
import { RecruteurController } from './recruteur.controller';
import { RecruteurService } from './recruteur.service';

@Module({
  imports: [ClubModule, ScoutModule],
  controllers: [RecruteurController],
  providers: [RecruteurService],
})
export class RecruteurModule {}
