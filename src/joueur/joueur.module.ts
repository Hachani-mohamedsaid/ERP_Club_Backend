import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { JoueurController } from './joueur.controller';
import { JoueurService } from './joueur.service';

@Module({
  imports: [ClubModule],
  controllers: [JoueurController],
  providers: [JoueurService],
})
export class JoueurModule {}
