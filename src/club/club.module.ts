import { Module } from '@nestjs/common';
import { ClubAccessService } from './club-access.service';
import { ClubAuditService } from './club-audit.service';
import { ValidationRequestService } from './validation-request.service';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { PreparateurService } from './preparateur.service';
import { CoachService } from './coach.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  controllers: [ClubController],
  providers: [ClubService, ClubAccessService, ClubAuditService, PermissionsGuard, PreparateurService, CoachService, ValidationRequestService],
  exports: [ClubService, ClubAuditService, ClubAccessService, PreparateurService, CoachService, ValidationRequestService],
})
export class ClubModule {}
