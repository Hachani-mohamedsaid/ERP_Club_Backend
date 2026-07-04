import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { SendNotificationEmailDto } from './dto/send-notification-email.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('email')
  sendEmail(@CurrentUser() user: JwtPayload, @Body() dto: SendNotificationEmailDto) {
    return this.notifications.sendEmail(user.email, dto.subject, dto.body);
  }
}
