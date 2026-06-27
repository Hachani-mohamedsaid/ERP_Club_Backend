import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClubMemberRole } from '@prisma/client';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { ClubService } from '../club.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { labelToClubRole } from '../permissions-seed';

function resolveClubRole(raw?: string): ClubMemberRole {
  if (!raw) return 'CLUB_ADMIN';
  if (raw === 'CLUB_ADMIN' || raw === 'Club Admin' || raw === 'Admin Club') return 'CLUB_ADMIN';
  if (Object.values(ClubMemberRole).includes(raw as ClubMemberRole)) {
    return raw as ClubMemberRole;
  }
  return labelToClubRole(raw);
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly club: ClubService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.get<{ module: string; action: 'read' | 'create' | 'update' | 'delete' } | undefined>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    if (!meta) return true;

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;
    if (!user?.organizationId) {
      throw new ForbiddenException('Organisation requise.');
    }
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    const clubRole = resolveClubRole(user.clubMemberRole);
    if (clubRole === 'CLUB_ADMIN') {
      return true;
    }

    const allowed = await this.club.checkPermission(
      user.organizationId,
      clubRole,
      meta.module,
      meta.action,
    );
    if (!allowed) {
      throw new ForbiddenException('Permission insuffisante pour cette action.');
    }
    return true;
  }
}
