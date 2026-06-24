import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ImgbbService } from '../imgbb/imgbb.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imgbb: ImgbbService,
    private readonly config: ConfigService,
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
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

    return {
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      organization: user.organization
        ? {
            id: user.organization.id,
            clubName: user.organization.clubName,
            country: user.organization.country,
            league: user.organization.league,
            logoUrl: user.organization.logoUrl,
          }
        : null,
    };
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
