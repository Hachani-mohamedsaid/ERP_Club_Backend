import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { ClubService } from '../club.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

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
    if (user.role === 'ADMIN_CLUB' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    const allowed = await this.club.checkPermission(
      user.organizationId,
      'CLUB_ADMIN',
      meta.module,
      meta.action,
    );
    if (!allowed) {
      throw new ForbiddenException('Permission insuffisante pour cette action.');
    }
    return true;
  }
}
