import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuditActionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ImgbbService } from '../imgbb/imgbb.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';
import { buildDefaultDashboardSeed } from '../organizations/dashboard-seed';
import { seedClubOps } from '../club/ops-seed';
import { ClubAuditService } from '../club/club-audit.service';
import { JwtPayload } from './jwt-payload.interface';
import { ClubMemberRole } from '@prisma/client';
import { clubRoleToLabel } from '../club/permissions-seed';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imgbb: ImgbbService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly audit: ClubAuditService,
  ) {}

  async registerOrganization(
    dto: RegisterOrganizationDto,
    logoFile?: Express.Multer.File,
  ) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas.');
    }

    if (!dto.acceptTerms || !dto.acceptPrivacy) {
      throw new BadRequestException(
        'Vous devez accepter les conditions et la politique de confidentialité.',
      );
    }

    await this.validateInvitationCode(dto.invitationCode);

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    let logoUrl: string | undefined;
    if (logoFile) {
      logoUrl = await this.imgbb.uploadImage(logoFile);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName.trim(),
          phone: dto.phone.trim(),
          role: 'ADMIN_CLUB',
          acceptTerms: dto.acceptTerms,
          acceptPrivacy: dto.acceptPrivacy,
          isActive: true,
        },
      });

      const organization = await tx.organization.create({
        data: {
          clubName: dto.clubName.trim(),
          country: dto.country.trim(),
          league: dto.league.trim(),
          logoUrl,
          invitationCode: dto.invitationCode?.trim() || null,
          ownerId: user.id,
        },
      });

      const seed = buildDefaultDashboardSeed(organization.clubName);
      await tx.clubDashboardStats.create({
        data: {
          organizationId: organization.id,
          playersCount: seed.playersCount,
          staffCount: seed.staffCount,
          budgetRemaining: seed.budgetRemaining,
          payrollTotal: seed.payrollTotal,
          injuredCount: seed.injuredCount,
          contractsToRenew: seed.contractsToRenew,
          budgetUsedPct: seed.budgetUsedPct,
          budgetChart: seed.budgetChart as unknown as Prisma.InputJsonValue,
          alerts: seed.alerts as unknown as Prisma.InputJsonValue,
          aiSummary: seed.aiSummary as unknown as Prisma.InputJsonValue,
        },
      });

      await seedClubOps(tx, {
        organizationId: organization.id,
        clubName: organization.clubName,
        country: organization.country,
        ownerFullName: user.fullName,
        ownerEmail: user.email,
        ownerPhone: user.phone,
        officialEmail: user.email,
      });

      if (dto.invitationCode?.trim()) {
        await tx.invitationCode.updateMany({
          where: { code: dto.invitationCode.trim(), isActive: true },
          data: { usedCount: { increment: 1 } },
        });
      }

      return { user, organization };
    });

    return {
      message: 'Organisation créée avec succès',
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: result.user.role,
      },
      organization: {
        id: result.organization.id,
        clubName: result.organization.clubName,
        country: result.organization.country,
        league: result.organization.league,
        logoUrl: result.organization.logoUrl,
      },
    };
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { ownedOrganization: true, memberOrganization: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const org = user.ownedOrganization ?? user.memberOrganization;
    const clubMemberRole = await this.resolveClubMemberRole(user.id, user.email, org?.id ?? null, user.clubMemberRole);
    const clubMemberRoleLabel = clubRoleToLabel(clubMemberRole);
    let playerId: string | null = null;
    if (org && clubMemberRole === 'JOUEUR') {
      const member = await this.prisma.clubMember.findFirst({
        where: { organizationId: org.id, email: user.email },
        select: { clubPlayerId: true },
      });
      playerId = member?.clubPlayerId ?? null;
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: org?.id ?? null,
      fullName: user.fullName,
      clubMemberRole,
    };

    const accessToken = await this.jwt.signAsync(payload);

    if (org) {
      await this.audit.log(org.id, {
        userName: user.fullName,
        userRole: clubMemberRoleLabel,
        action: 'Connexion',
        entity: '—',
        details: 'Connexion réussie',
        type: AuditActionType.CONNEXION,
        ipAddress: ip,
      });
      await this.prisma.clubMember.updateMany({
        where: { organizationId: org.id, email: user.email },
        data: { lastLoginAt: new Date() },
      });
    }

    return {
      message: 'Connexion réussie',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        clubMemberRole: clubMemberRoleLabel,
        playerId,
      },
      organization: org
        ? {
            id: org.id,
            clubName: org.clubName,
            country: org.country,
            league: org.league,
            logoUrl: org.logoUrl,
          }
        : null,
    };
  }

  private async resolveClubMemberRole(
    userId: string,
    email: string,
    organizationId: string | null,
    storedRole: ClubMemberRole | null,
  ): Promise<ClubMemberRole> {
    if (storedRole) return storedRole;
    if (!organizationId) return 'CLUB_ADMIN';

    const member = await this.prisma.clubMember.findFirst({
      where: { organizationId, email },
    });
    if (member) return member.clubRole;

    const owner = await this.prisma.organization.findFirst({
      where: { ownerId: userId },
    });
    return owner ? 'CLUB_ADMIN' : 'CLUB_ADMIN';
  }

  signToken(payload: JwtPayload) {
    return this.jwt.signAsync(payload);
  }

  private async validateInvitationCode(code?: string) {
    const requiredCodes = this.config
      .get<string>('VALID_INVITATION_CODES', '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (requiredCodes.length === 0) return;

    const normalized = code?.trim();
    if (!normalized || !requiredCodes.includes(normalized)) {
      throw new UnauthorizedException('Code invitation invalide.');
    }

    const record = await this.prisma.invitationCode.findUnique({
      where: { code: normalized },
    });

    if (record && !record.isActive) {
      throw new UnauthorizedException('Code invitation désactivé.');
    }

    if (record?.maxUses != null && record.usedCount >= record.maxUses) {
      throw new UnauthorizedException('Code invitation épuisé.');
    }
  }
}
