import { Injectable } from '@nestjs/common';
import { RecruteurAuditAction, RecruteurAuditSeverity } from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecruteurAuditService } from './recruteur-audit.service';

@Injectable()
export class RecruteurService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
    private readonly audit: RecruteurAuditService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  private toDto(n: {
    id: string;
    type: string;
    title: string;
    body: string;
    priority: string;
    isRead: boolean;
    player: string | null;
    createdAt: Date;
  }) {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      time: n.createdAt.toISOString(),
      priority: n.priority,
      read: n.isRead,
      player: n.player,
    };
  }

  async listNotifications(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const notifications = await this.prisma.recruteurNotification.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map((n) => this.toDto(n));
  }

  async markNotificationRead(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const notification = await this.prisma.recruteurNotification.update({
      where: { id, organizationId },
      data: { isRead: true },
    });
    return { id: notification.id, read: notification.isRead };
  }

  async markAllNotificationsRead(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const { count } = await this.prisma.recruteurNotification.updateMany({
      where: { organizationId, isRead: false },
      data: { isRead: true },
    });
    if (count > 0) {
      await this.audit.log(organizationId, {
        userName: user.fullName,
        userRole: user.clubMemberRole ?? user.role,
        action: RecruteurAuditAction.MODIFICATION,
        description: `a marqué ${count} notification(s) comme lue(s)`,
        severity: 'INFO',
      });
    }
    return { success: true };
  }

  async deleteNotification(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    const notification = await this.prisma.recruteurNotification.delete({
      where: { id, organizationId },
    });
    await this.audit.log(organizationId, {
      userName: user.fullName,
      userRole: user.clubMemberRole ?? user.role,
      action: RecruteurAuditAction.SUPPRESSION,
      description: `a supprimé la notification "${notification.title}"`,
      player: notification.player ?? undefined,
      severity: 'WARNING',
    });
    return { id };
  }

  private toAuditDto(l: {
    id: string;
    userName: string;
    userRole: string;
    action: RecruteurAuditAction;
    description: string;
    player: string | null;
    ipAddress: string | null;
    severity: string;
    createdAt: Date;
  }) {
    return {
      id: l.id,
      user: l.userName,
      role: l.userRole,
      action: l.action.toLowerCase(),
      description: l.description,
      player: l.player,
      datetime: l.createdAt.toISOString(),
      ip: l.ipAddress ?? '—',
      severity: l.severity.toLowerCase(),
    };
  }

  async listAuditLogs(
    user: JwtPayload,
    filters?: { action?: string; severity?: string; search?: string },
  ) {
    const organizationId = this.orgId(user);
    const logs = await this.prisma.recruteurAuditLog.findMany({
      where: {
        organizationId,
        ...(filters?.action && filters.action !== 'all'
          ? { action: filters.action.toUpperCase() as RecruteurAuditAction }
          : {}),
        ...(filters?.severity && filters.severity !== 'all'
          ? { severity: filters.severity.toUpperCase() as RecruteurAuditSeverity }
          : {}),
        ...(filters?.search
          ? {
              OR: [
                { userName: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { player: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return logs.map((l) => this.toAuditDto(l));
  }
}
