import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { AnalysteService } from './analyste.service';
import { AnalysteVideoAiService } from './analyste-video-ai.service';
import { PredictMatchDto } from './dto/predict-match.dto';
import { ProcessVideoDto } from './dto/process-video.dto';

@Controller('analyste')
@UseGuards(JwtAuthGuard)
export class AnalysteController {
  constructor(
    private readonly analyste: AnalysteService,
    private readonly videoAi: AnalysteVideoAiService,
  ) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.analyste.getDashboard(user);
  }

  @Get('executive')
  getExecutive(@CurrentUser() user: JwtPayload) {
    return this.analyste.getExecutive(user);
  }

  @Get('live-match')
  getLiveMatch(@CurrentUser() user: JwtPayload) {
    return this.analyste.getLiveMatch(user);
  }

  @Get('prediction/teams')
  getPredictionTeams(@CurrentUser() user: JwtPayload) {
    return this.analyste.getPredictionTeams(user);
  }

  @Post('prediction')
  predictMatch(@CurrentUser() user: JwtPayload, @Body() dto: PredictMatchDto) {
    return this.analyste.predictMatch(user, dto.home, dto.away);
  }

  @Get('ppi')
  getPPI(@CurrentUser() user: JwtPayload) {
    return this.analyste.getPPI(user);
  }

  @Get('chemistry')
  getChemistry(@CurrentUser() user: JwtPayload) {
    return this.analyste.getChemistry(user);
  }

  @Get('patterns')
  getPatterns(@CurrentUser() user: JwtPayload) {
    return this.analyste.getPatterns(user);
  }

  @Get('tactical')
  getTactical(@CurrentUser() user: JwtPayload) {
    return this.analyste.getTactical(user);
  }

  @Get('video-analysis')
  getVideoAnalysis(@CurrentUser() user: JwtPayload) {
    return this.analyste.getVideoAnalysis(user);
  }

  @Post('video-analysis/process')
  processVideoAnalysis(@CurrentUser() user: JwtPayload, @Body() dto: ProcessVideoDto) {
    return this.videoAi.processVideo(user, dto);
  }

  @Get('video-coach')
  getVideoCoach(@CurrentUser() user: JwtPayload) {
    return this.analyste.getVideoCoach(user);
  }

  @Get('replay')
  getReplay(@CurrentUser() user: JwtPayload) {
    return this.analyste.getReplay(user);
  }

  @Get('opponent')
  getOpponent(@CurrentUser() user: JwtPayload) {
    return this.analyste.getOpponent(user);
  }

  @Get('fatigue')
  getFatigue(@CurrentUser() user: JwtPayload) {
    return this.analyste.getFatigue(user);
  }

  @Get('whoop')
  getWhoop(@CurrentUser() user: JwtPayload) {
    return this.analyste.getWhoop(user);
  }

  @Get('injuries')
  getInjuries(@CurrentUser() user: JwtPayload) {
    return this.analyste.getInjuries(user);
  }

  @Get('injury-forecast')
  getInjuryForecast(@CurrentUser() user: JwtPayload) {
    return this.analyste.getInjuryForecast(user);
  }

  @Get('transfer')
  getTransfer(@CurrentUser() user: JwtPayload) {
    return this.analyste.getTransfer(user);
  }

  @Get('market-value')
  getMarketValue(@CurrentUser() user: JwtPayload) {
    return this.analyste.getMarketValue(user);
  }

  @Get('scouting')
  getScouting(@CurrentUser() user: JwtPayload) {
    return this.analyste.getScouting(user);
  }

  @Get('evolution')
  getEvolution(@CurrentUser() user: JwtPayload) {
    return this.analyste.getEvolution(user);
  }

  @Get('training')
  getTraining(@CurrentUser() user: JwtPayload) {
    return this.analyste.getTraining(user);
  }
}
