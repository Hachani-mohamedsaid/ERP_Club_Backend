import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
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
}
