import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { JoueurAiChatDto } from './dto/joueur-ai-chat.dto';
import { JoueurService } from './joueur.service';

@Controller('joueur')
@UseGuards(JwtAuthGuard)
export class JoueurController {
  constructor(private readonly joueur: JoueurService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.joueur.getMe(user);
  }

  @Get('me/extended')
  getExtended(@CurrentUser() user: JwtPayload) {
    return this.joueur.getExtended(user);
  }

  @Get('me/calendar')
  getCalendar(@CurrentUser() user: JwtPayload) {
    return this.joueur.getCalendar(user);
  }

  @Get('me/injuries')
  getInjuries(@CurrentUser() user: JwtPayload) {
    return this.joueur.getInjuries(user);
  }

  @Get('squad')
  getSquad(@CurrentUser() user: JwtPayload) {
    return this.joueur.getSquad(user);
  }

  @Get('ai')
  getJoueurAi(@CurrentUser() user: JwtPayload) {
    return this.joueur.getJoueurAi(user);
  }

  @Get('ai/report')
  getJoueurAiReport(@CurrentUser() user: JwtPayload, @Query('refresh') refresh?: string) {
    return this.joueur.getJoueurAiReport(user, refresh === '1' || refresh === 'true');
  }

  @Post('ai/chat')
  chatJoueurAi(@CurrentUser() user: JwtPayload, @Body() dto: JoueurAiChatDto) {
    return this.joueur.chatJoueurAi(user, dto.question);
  }
}
