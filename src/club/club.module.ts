import { Module } from '@nestjs/common';
import { ClubAccessService } from './club-access.service';
import { ClubAuditService } from './club-audit.service';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { PreparateurService } from './preparateur.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  controllers: [ClubController],
  providers: [ClubService, ClubAccessService, ClubAuditService, PermissionsGuard, PreparateurService],
  exports: [ClubService, ClubAuditService, ClubAccessService, PreparateurService],
})
export class ClubModule {}
