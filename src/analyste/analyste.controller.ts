import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysteService } from './analyste.service';
import { PredictMatchDto } from './dto/predict-match.dto';

@Controller('analyste')
@UseGuards(JwtAuthGuard)
export class AnalysteController {
  constructor(private readonly analyste: AnalysteService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyste.getDashboard();
  }

  @Get('executive')
  getExecutive() {
    return this.analyste.getExecutive();
  }

  @Get('live-match')
  getLiveMatch() {
    return this.analyste.getLiveMatch();
  }

  @Get('prediction/teams')
  getPredictionTeams() {
    return this.analyste.getPredictionTeams();
  }

  @Post('prediction')
  predictMatch(@Body() dto: PredictMatchDto) {
    return this.analyste.predictMatch(dto.home, dto.away);
  }

  @Get('ppi')
  getPPI() {
    return this.analyste.getPPI();
  }

  @Get('chemistry')
  getChemistry() {
    return this.analyste.getChemistry();
  }

  @Get('patterns')
  getPatterns() {
    return this.analyste.getPatterns();
  }

  @Get('tactical')
  getTactical() {
    return this.analyste.getTactical();
  }

  @Get('video-analysis')
  getVideoAnalysis() {
    return this.analyste.getVideoAnalysis();
  }

  @Get('video-coach')
  getVideoCoach() {
    return this.analyste.getVideoCoach();
  }

  @Get('replay')
  getReplay() {
    return this.analyste.getReplay();
  }

  @Get('opponent')
  getOpponent() {
    return this.analyste.getOpponent();
  }

  @Get('fatigue')
  getFatigue() {
    return this.analyste.getFatigue();
  }

  @Get('whoop')
  getWhoop() {
    return this.analyste.getWhoop();
  }

  @Get('injuries')
  getInjuries() {
    return this.analyste.getInjuries();
  }

  @Get('injury-forecast')
  getInjuryForecast() {
    return this.analyste.getInjuryForecast();
  }

  @Get('transfer')
  getTransfer() {
    return this.analyste.getTransfer();
  }

  @Get('market-value')
  getMarketValue() {
    return this.analyste.getMarketValue();
  }

  @Get('scouting')
  getScouting() {
    return this.analyste.getScouting();
  }

  @Get('evolution')
  getEvolution() {
    return this.analyste.getEvolution();
  }

  @Get('training')
  getTraining() {
    return this.analyste.getTraining();
  }
}
