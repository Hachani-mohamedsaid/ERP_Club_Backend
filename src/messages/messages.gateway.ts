import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { MessagesService } from './messages.service';

type AuthedSocket = Socket & { user?: JwtPayload; memberId?: string };

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private readonly onlineMembers = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly messages: MessagesService,
  ) {}

  private orgRoom(orgId: string) {
    return `org:${orgId}`;
  }

  private memberRoom(memberId: string) {
    return `member:${memberId}`;
  }

  private setOnline(orgId: string, memberId: string, socketId: string) {
    const key = `${orgId}:${memberId}`;
    const set = this.onlineMembers.get(key) ?? new Set<string>();
    set.add(socketId);
    this.onlineMembers.set(key, set);
    this.server.to(this.orgRoom(orgId)).emit('presence:update', {
      memberId,
      online: true,
    });
  }

  private setOffline(orgId: string, memberId: string, socketId: string) {
    const key = `${orgId}:${memberId}`;
    const set = this.onlineMembers.get(key);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) {
      this.onlineMembers.delete(key);
      this.server.to(this.orgRoom(orgId)).emit('presence:update', {
        memberId,
        online: false,
      });
    }
  }

  isMemberOnline(orgId: string, memberId: string) {
    return (this.onlineMembers.get(`${orgId}:${memberId}`)?.size ?? 0) > 0;
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.query?.token as string | undefined);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET', 'odin-erp-dev-secret-change-me'),
      });
      if (!payload.organizationId) {
        client.disconnect();
        return;
      }
      const memberId = await this.messages.resolveMemberId(payload);
      client.user = payload;
      client.memberId = memberId;
      await client.join(this.orgRoom(payload.organizationId));
      await client.join(this.memberRoom(memberId));
      this.setOnline(payload.organizationId, memberId, client.id);

      const orgId = payload.organizationId;
      const prefix = `${orgId}:`;
      const onlineIds = [...this.onlineMembers.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
      client.emit('presence:sync', { onlineMemberIds: onlineIds });
    } catch (err) {
      this.logger.warn(`WS auth failed: ${String(err)}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthedSocket) {
    if (client.user?.organizationId && client.memberId) {
      this.setOffline(client.user.organizationId, client.memberId, client.id);
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { peerMemberId: string },
  ) {
    if (!client.memberId || !data?.peerMemberId) return;
    this.server.to(this.memberRoom(data.peerMemberId)).emit('typing:start', {
      memberId: client.memberId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { peerMemberId: string },
  ) {
    if (!client.memberId || !data?.peerMemberId) return;
    this.server.to(this.memberRoom(data.peerMemberId)).emit('typing:stop', {
      memberId: client.memberId,
    });
  }

  @SubscribeMessage('message:delivered')
  handleDelivered(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { messageId: string; conversationId: string; senderMemberId: string },
  ) {
    if (!client.memberId || !data?.messageId) return;
    this.server.to(this.memberRoom(data.senderMemberId)).emit('message:status', {
      messageId: data.messageId,
      conversationId: data.conversationId,
      status: 'delivered',
    });
  }

  emitNewMessage(orgId: string, peerMemberId: string, payload: unknown) {
    this.server.to(this.memberRoom(peerMemberId)).emit('message:new', payload);
    this.server.to(this.orgRoom(orgId)).emit('conversation:update', payload);
  }

  emitMessageRead(
    orgId: string,
    senderMemberId: string,
    payload: { conversationId: string; readerMemberId: string },
  ) {
    this.server.to(this.memberRoom(senderMemberId)).emit('message:read', payload);
    this.server.to(this.orgRoom(orgId)).emit('conversation:read', payload);
  }

  emitConversationDeleted(
    orgId: string,
    peerMemberId: string,
    payload: { conversationId: string; deletedByMemberId: string },
  ) {
    this.server.to(this.memberRoom(peerMemberId)).emit('conversation:deleted', payload);
    this.server.to(this.memberRoom(payload.deletedByMemberId)).emit('conversation:deleted', payload);
  }
}
