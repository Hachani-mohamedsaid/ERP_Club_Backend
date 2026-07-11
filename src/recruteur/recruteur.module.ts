import { Module } from '@nestjs/common';
import { ClubModule } from '../club/club.module';
import { ScoutModule } from '../scout/scout.module';
import { RecruteurController } from './recruteur.controller';
import { RecruteurService } from './recruteur.service';
import { RecruteurNotificationsController } from './recruteur-notifications.controller';
import { RecruteurNotificationsService } from './recruteur-notifications.service';
import { RecruteurAuditService } from './recruteur-audit.service';
import { RecruteurCalendarController } from './recruteur-calendar.controller';
import { RecruteurCalendarService } from './recruteur-calendar.service';

@Module({
  imports: [ClubModule, ScoutModule],
  controllers: [RecruteurController, RecruteurNotificationsController, RecruteurCalendarController],
  providers: [RecruteurService, RecruteurNotificationsService, RecruteurAuditService, RecruteurCalendarService],
})
export class RecruteurModule {}
