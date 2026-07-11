import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { RecruteurController } from './recruteur.controller';
import { RecruteurService } from './recruteur.service';
import { RecruteurAuditService } from './recruteur-audit.service';

@Module({
  imports: [ClubModule],
  controllers: [RecruteurController],
  providers: [RecruteurService, RecruteurAuditService],
  exports: [RecruteurService],
})
export class RecruteurModule {}
