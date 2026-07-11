import { Injectable } from '@nestjs/common';
import { RecruteurCalendarEventType } from '@prisma/client';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubAccessService } from '../club/club-access.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecruteurCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClubAccessService,
  ) {}

  private orgId(user: JwtPayload) {
    return this.access.requireOrganization(user);
  }

  private toDto(e: {
    id: string;
    title: string;
    eventDate: Date;
    eventTime: string | null;
    type: RecruteurCalendarEventType;
    location: string | null;
    note: string | null;
  }) {
    return {
      id: e.id,
      title: e.title,
      date: e.eventDate.toISOString().slice(0, 10),
      time: e.eventTime ?? '',
      type: e.type.toLowerCase(),
      location: e.location,
      note: e.note,
    };
  }

  async listEvents(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const events = await this.prisma.recruteurCalendarEvent.findMany({
      where: { organizationId },
      orderBy: { eventDate: 'asc' },
    });
    return events.map((e) => this.toDto(e));
  }

  async createEvent(
    user: JwtPayload,
    data: {
      title: string;
      date: string;
      time?: string;
      type?: string;
      location?: string;
      note?: string;
    },
  ) {
    const organizationId = this.orgId(user);
    const event = await this.prisma.recruteurCalendarEvent.create({
      data: {
        organizationId,
        title: data.title,
        eventDate: new Date(`${data.date}T00:00:00`),
        eventTime: data.time,
        type: (data.type?.toUpperCase() as RecruteurCalendarEventType) ?? 'MATCH',
        location: data.location,
        note: data.note,
      },
    });
    return this.toDto(event);
  }

  async deleteEvent(user: JwtPayload, id: string) {
    const organizationId = this.orgId(user);
    await this.prisma.recruteurCalendarEvent.delete({ where: { id, organizationId } });
    return { id };
  }
}
