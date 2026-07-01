import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { clubRoleToLabel } from '../club/permissions-seed';
import { PrismaService } from '../prisma/prisma.service';

export type MessageStatus = 'sent' | 'delivered' | 'read';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private orgId(user: JwtPayload) {
    if (!user.organizationId) {
      throw new ForbiddenException('Organisation requise.');
    }
    return user.organizationId;
  }

  async resolveMemberId(user: JwtPayload) {
    const organizationId = this.orgId(user);
    const member = await this.prisma.clubMember.findFirst({
      where: { organizationId, email: user.email },
    });
    if (!member) {
      throw new ForbiddenException('Profil membre introuvable.');
    }
    return member.id;
  }

  private normalizePair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  private formatTime(date: Date) {
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'Hier';
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  }

  private async getMemberMap(organizationId: string, memberIds: string[]) {
    const unique = [...new Set(memberIds)];
    const members = await this.prisma.clubMember.findMany({
      where: { organizationId, id: { in: unique } },
    });
    return new Map(members.map((m) => [m.id, m]));
  }

  private async unreadCount(conversationId: string, myMemberId: string) {
    return this.prisma.clubDirectMessage.count({
      where: {
        conversationId,
        senderMemberId: { not: myMemberId },
        reads: { none: { memberId: myMemberId } },
      },
    });
  }

  private async messageStatus(
    messageId: string,
    senderMemberId: string,
    myMemberId: string,
    peerMemberId: string,
  ): Promise<MessageStatus> {
    if (senderMemberId !== myMemberId) return 'read';
    const hasPeerRead = await this.prisma.clubDirectMessageRead.findFirst({
      where: { messageId, memberId: peerMemberId },
    });
    return hasPeerRead ? 'read' : 'sent';
  }

  private async unreadCountsByConversation(
    conversationIds: string[],
    myMemberId: string,
  ): Promise<Map<string, number>> {
    if (conversationIds.length === 0) return new Map();
    const unreadMessages = await this.prisma.clubDirectMessage.findMany({
      where: {
        conversationId: { in: conversationIds },
        senderMemberId: { not: myMemberId },
        reads: { none: { memberId: myMemberId } },
      },
      select: { conversationId: true },
    });
    const map = new Map<string, number>();
    for (const row of unreadMessages) {
      map.set(row.conversationId, (map.get(row.conversationId) ?? 0) + 1);
    }
    return map;
  }

  private mapContact(
    m: { id: string; fullName: string; clubRole: Parameters<typeof clubRoleToLabel>[0] },
    conv: { id: string; messages: { body: string; createdAt: Date }[] } | undefined,
    unread: number,
  ) {
    const last = conv?.messages[0];
    return {
      memberId: m.id,
      name: m.fullName,
      role: clubRoleToLabel(m.clubRole),
      avatar: this.initials(m.fullName),
      conversationId: conv?.id ?? null,
      preview: last?.body ?? '',
      time: last ? this.formatTime(last.createdAt) : '',
      unread,
      online: false,
      typing: false,
    };
  }

  async listContacts(user: JwtPayload, search?: string) {
    const organizationId = this.orgId(user);
    const myMemberId = await this.resolveMemberId(user);
    const q = search?.trim().toLowerCase() ?? '';

    const conversations = await this.prisma.clubDirectConversation.findMany({
      where: {
        organizationId,
        OR: [{ participantAId: myMemberId }, { participantBId: myMemberId }],
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const convByPeer = new Map<string, (typeof conversations)[number]>();
    for (const conv of conversations) {
      const peerId =
        conv.participantAId === myMemberId
          ? conv.participantBId
          : conv.participantAId;
      convByPeer.set(peerId, conv);
    }

    const unreadMap = await this.unreadCountsByConversation(
      conversations.map((c) => c.id),
      myMemberId,
    );

    if (!q) {
      const peerIds = [...convByPeer.keys()];
      if (peerIds.length === 0) {
        return { myMemberId, items: [] };
      }
      const members = await this.prisma.clubMember.findMany({
        where: { organizationId, id: { in: peerIds } },
      });
      const memberMap = new Map(members.map((m) => [m.id, m]));
      const withMessages = peerIds
        .map((id) => memberMap.get(id))
        .filter((m): m is NonNullable<typeof m> => !!m)
        .map((m) => {
          const conv = convByPeer.get(m.id)!;
          return this.mapContact(m, conv, unreadMap.get(conv.id) ?? 0);
        })
        .sort((a, b) => {
          const ca = convByPeer.get(a.memberId);
          const cb = convByPeer.get(b.memberId);
          return (
            (cb?.lastMessageAt?.getTime() ?? 0) -
            (ca?.lastMessageAt?.getTime() ?? 0)
          );
        });
      return { myMemberId, items: withMessages };
    }

    const members = await this.prisma.clubMember.findMany({
      where: {
        organizationId,
        id: { not: myMemberId },
        status: 'ACTIF',
        fullName: { contains: q, mode: 'insensitive' },
      },
      orderBy: { fullName: 'asc' },
      take: 40,
    });

    const items = members.map((m) => {
      const conv = convByPeer.get(m.id);
      const unread = conv ? (unreadMap.get(conv.id) ?? 0) : 0;
      return this.mapContact(m, conv, unread);
    });

    const withMessages = items
      .filter((i) => i.conversationId)
      .sort((a, b) => {
        const ca = convByPeer.get(a.memberId);
        const cb = convByPeer.get(b.memberId);
        return (
          (cb?.lastMessageAt?.getTime() ?? 0) -
          (ca?.lastMessageAt?.getTime() ?? 0)
        );
      });
    const withoutMessages = items
      .filter((i) => !i.conversationId)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    return {
      myMemberId,
      items: withMessages,
      searchResults: [...withMessages, ...withoutMessages],
    };
  }

  async deleteConversation(user: JwtPayload, conversationId: string) {
    const organizationId = this.orgId(user);
    const myMemberId = await this.resolveMemberId(user);

    const conversation = await this.prisma.clubDirectConversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        OR: [{ participantAId: myMemberId }, { participantBId: myMemberId }],
      },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');

    const messageIds = await this.prisma.clubDirectMessage.findMany({
      where: { conversationId },
      select: { id: true },
    });

    if (messageIds.length > 0) {
      await this.prisma.clubDirectMessageRead.deleteMany({
        where: { messageId: { in: messageIds.map((m) => m.id) } },
      });
      await this.prisma.clubDirectMessage.deleteMany({ where: { conversationId } });
    }

    await this.prisma.clubDirectConversation.delete({ where: { id: conversationId } });

    return {
      deleted: true,
      peerMemberId:
        conversation.participantAId === myMemberId
          ? conversation.participantBId
          : conversation.participantAId,
    };
  }

  async getThread(user: JwtPayload, peerMemberId: string) {
    const organizationId = this.orgId(user);
    const myMemberId = await this.resolveMemberId(user);

    const peer = await this.prisma.clubMember.findFirst({
      where: { id: peerMemberId, organizationId },
    });
    if (!peer) throw new NotFoundException('Contact introuvable.');

    const [participantAId, participantBId] = this.normalizePair(
      myMemberId,
      peerMemberId,
    );

    let conversation = await this.prisma.clubDirectConversation.findUnique({
      where: {
        organizationId_participantAId_participantBId: {
          organizationId,
          participantAId,
          participantBId,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.clubDirectConversation.create({
        data: {
          organizationId,
          participantAId,
          participantBId,
        },
      });
    }

    const messages = await this.prisma.clubDirectMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    await this.markConversationRead(user, conversation.id);

    const formatted = await Promise.all(
      messages.map(async (msg) => ({
        id: msg.id,
        text: msg.body,
        sent: msg.senderMemberId === myMemberId,
        time: msg.createdAt.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: await this.messageStatus(
          msg.id,
          msg.senderMemberId,
          myMemberId,
          peerMemberId,
        ),
      })),
    );

    return {
      conversationId: conversation.id,
      peer: {
        memberId: peer.id,
        name: peer.fullName,
        role: clubRoleToLabel(peer.clubRole),
        avatar: this.initials(peer.fullName),
      },
      messages: formatted,
    };
  }

  async sendMessage(user: JwtPayload, peerMemberId: string, body: string) {
    const organizationId = this.orgId(user);
    const myMemberId = await this.resolveMemberId(user);
    const trimmed = body.trim();
    if (!trimmed) {
      throw new ForbiddenException('Message vide.');
    }

    const peer = await this.prisma.clubMember.findFirst({
      where: { id: peerMemberId, organizationId },
    });
    if (!peer) throw new NotFoundException('Contact introuvable.');

    const [participantAId, participantBId] = this.normalizePair(
      myMemberId,
      peerMemberId,
    );

    let conversation = await this.prisma.clubDirectConversation.findUnique({
      where: {
        organizationId_participantAId_participantBId: {
          organizationId,
          participantAId,
          participantBId,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.clubDirectConversation.create({
        data: { organizationId, participantAId, participantBId },
      });
    }

    const message = await this.prisma.clubDirectMessage.create({
      data: {
        conversationId: conversation.id,
        senderMemberId: myMemberId,
        body: trimmed,
      },
    });

    await this.prisma.clubDirectConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: message.createdAt },
    });

    const sender = await this.prisma.clubMember.findUnique({
      where: { id: myMemberId },
    });

    return {
      conversationId: conversation.id,
      message: {
        id: message.id,
        text: message.body,
        sent: true,
        time: message.createdAt.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'sent' as MessageStatus,
      },
      peerMemberId,
      sender: {
        memberId: myMemberId,
        name: sender?.fullName ?? user.fullName,
        role: sender ? clubRoleToLabel(sender.clubRole) : user.clubMemberRole,
        avatar: this.initials(sender?.fullName ?? user.fullName),
      },
    };
  }

  async markConversationRead(user: JwtPayload, conversationId: string) {
    const organizationId = this.orgId(user);
    const myMemberId = await this.resolveMemberId(user);

    const conversation = await this.prisma.clubDirectConversation.findFirst({
      where: { id: conversationId, organizationId },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable.');

    const unreadMessages = await this.prisma.clubDirectMessage.findMany({
      where: {
        conversationId,
        senderMemberId: { not: myMemberId },
        reads: { none: { memberId: myMemberId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) return { marked: 0 };

    await this.prisma.clubDirectMessageRead.createMany({
      data: unreadMessages.map((m) => ({
        messageId: m.id,
        memberId: myMemberId,
      })),
      skipDuplicates: true,
    });

    return { marked: unreadMessages.length };
  }
}
