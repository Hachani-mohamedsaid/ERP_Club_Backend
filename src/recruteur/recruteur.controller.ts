import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { RecruteurService } from './recruteur.service';

@Controller('club/recruteur')
@UseGuards(JwtAuthGuard)
export class RecruteurController {
  constructor(private readonly recruteur: RecruteurService) {}

  @Get('notifications')
  listNotifications(@CurrentUser() user: JwtPayload) {
    return this.recruteur.listNotifications(user);
  }

  @Patch('notifications/read-all')
  markAllNotificationsRead(@CurrentUser() user: JwtPayload) {
    return this.recruteur.markAllNotificationsRead(user);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.recruteur.markNotificationRead(user, id);
  }

  @Delete('notifications/:id')
  deleteNotification(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.recruteur.deleteNotification(user, id);
  }

  @Get('audit-logs')
  listAuditLogs(
    @CurrentUser() user: JwtPayload,
    @Query('action') action?: string,
    @Query('severity') severity?: string,
    @Query('search') search?: string,
  ) {
    return this.recruteur.listAuditLogs(user, { action, severity, search });
  }
}
