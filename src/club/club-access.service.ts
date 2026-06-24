import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';

@Injectable()
export class ClubAccessService {
  requireOrganization(user: JwtPayload): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Aucune organisation associée à ce compte.');
    }
    return user.organizationId;
  }

  requireClubAdmin(user: JwtPayload): void {
    if (user.role !== 'ADMIN_CLUB' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Accès réservé à l\'administrateur du club.');
    }
  }
}
