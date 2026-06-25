import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtPayload } from '../../auth/jwt-payload.interface';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtPayload | undefined;
    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Accès réservé au Super Admin.');
    }
    return true;
  }
}
