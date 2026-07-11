import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { RecruteurCalendarService } from './recruteur-calendar.service';

@Controller('club/recruteur/calendar')
@UseGuards(JwtAuthGuard)
export class RecruteurCalendarController {
  constructor(private readonly calendar: RecruteurCalendarService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.calendar.listEvents(user);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { title: string; date: string; time?: string; type?: string; location?: string; note?: string },
  ) {
    return this.calendar.createEvent(user, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.calendar.deleteEvent(user, id);
  }
}
