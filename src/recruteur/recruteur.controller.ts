import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { RecruteurAiReportDto, RecruteurAiSearchDto } from './dto/recruteur-ai.dto';
import { RecruteurService } from './recruteur.service';

@Controller('recruteur')
@UseGuards(JwtAuthGuard)
export class RecruteurController {
  constructor(private readonly recruteur: RecruteurService) {}

  @Get('ai')
  getAi(@CurrentUser() user: JwtPayload) {
    return this.recruteur.getRecruteurAi(user);
  }

  @Post('ai/search')
  searchAi(@CurrentUser() user: JwtPayload, @Body() dto: RecruteurAiSearchDto) {
    return this.recruteur.searchRecruteurAi(user, dto.query);
  }

  @Post('ai/report')
  generateReport(@CurrentUser() user: JwtPayload, @Body() dto: RecruteurAiReportDto) {
    return this.recruteur.generateReport(user, dto.templateId, dto.format);
  }

  @Get('shortlist')
  listShortlist(@CurrentUser() user: JwtPayload) {
    return this.recruteur.listShortlist(user);
  }

  @Get('validation')
  listValidation(@CurrentUser() user: JwtPayload) {
    return this.recruteur.listValidation(user);
  }
}
