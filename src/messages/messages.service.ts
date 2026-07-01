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

  async listContacts(user: JwtPayload, search?: string) {
    const organizationId = this.orgId(user);
    const myMemberId = await this.resolveMemberId(user);
    const q = search?.trim().toLowerCase() ?? '';

    const members = await this.prisma.clubMember.findMany({
      where: {
        organizationId,
        id: { not: myMemberId },
        status: 'ACTIF',
      },
      orderBy: { fullName: 'asc' },
    });

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

    const items = await Promise.all(
      members.map(async (m) => {
        const conv = convByPeer.get(m.id);
        const last = conv?.messages[0];
        const unread = conv ? await this.unreadCount(conv.id, myMemberId) : 0;
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
      }),
    );

    const filtered = q
      ? items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.role.toLowerCase().includes(q),
        )
      : items;

    const withMessages = filtered
      .filter((i) => i.conversationId)
      .sort((a, b) => {
        const ca = convByPeer.get(a.memberId);
        const cb = convByPeer.get(b.memberId);
        return (
          (cb?.lastMessageAt?.getTime() ?? 0) -
          (ca?.lastMessageAt?.getTime() ?? 0)
        );
      });

    const withoutMessages = filtered
      .filter((i) => !i.conversationId)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    return {
      myMemberId,
      items: q ? [...withMessages, ...withoutMessages] : withMessages,
      searchResults: q ? [...withMessages, ...withoutMessages] : undefined,
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
