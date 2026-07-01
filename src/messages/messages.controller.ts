import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messages: MessagesService,
    private readonly gateway: MessagesGateway,
  ) {}

  @Get('contacts')
  listContacts(@CurrentUser() user: JwtPayload, @Query('search') search?: string) {
    return this.messages.listContacts(user, search);
  }

  @Get('thread/:peerMemberId')
  async getThread(
    @CurrentUser() user: JwtPayload,
    @Param('peerMemberId') peerMemberId: string,
  ) {
    const thread = await this.messages.getThread(user, peerMemberId);
    const myMemberId = await this.messages.resolveMemberId(user);
    if (user.organizationId && peerMemberId !== myMemberId) {
      this.gateway.emitMessageRead(user.organizationId, peerMemberId, {
        conversationId: thread.conversationId,
        readerMemberId: myMemberId,
      });
    }
    return thread;
  }

  @Post('thread/:peerMemberId')
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('peerMemberId') peerMemberId: string,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.messages.sendMessage(user, peerMemberId, dto.body);
    if (user.organizationId) {
      this.gateway.emitNewMessage(user.organizationId, peerMemberId, {
        conversationId: result.conversationId,
        peerMemberId,
        message: result.message,
        sender: result.sender,
      });
    }
    return result;
  }

  @Patch('conversations/:conversationId/read')
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messages.markConversationRead(user, conversationId);
  }
}
