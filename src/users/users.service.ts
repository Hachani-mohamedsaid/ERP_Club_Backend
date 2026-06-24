import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        ownedOrganization: {
          select: {
            id: true,
            clubName: true,
            country: true,
            league: true,
            logoUrl: true,
          },
        },
        memberOrganization: {
          select: {
            id: true,
            clubName: true,
            country: true,
            league: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create() {
    throw new Error(
      'Utilisez POST /auth/register pour créer une organisation.',
    );
  }
}