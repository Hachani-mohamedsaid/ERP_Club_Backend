import { Module } from '@nestjs/common';
import { ClubAccessService } from './club-access.service';
import { ClubAuditService } from './club-audit.service';
import { ValidationRequestService } from './validation-request.service';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { PreparateurService } from './preparateur.service';
import { CoachService } from './coach.service';
import { MedicalService } from './medical.service';
import { FinanceAiService } from './finance-ai.service';
import { FinanceNotificationsService } from './finance-notifications.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  controllers: [ClubController],
  providers: [ClubService, ClubAccessService, ClubAuditService, PermissionsGuard, PreparateurService, CoachService, MedicalService, FinanceAiService, FinanceNotificationsService, ValidationRequestService],
  exports: [ClubService, ClubAuditService, ClubAccessService, PreparateurService, CoachService, MedicalService, FinanceAiService, FinanceNotificationsService, ValidationRequestService],
})
export class ClubModule {}
