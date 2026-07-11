import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { ScoutService } from './scout.service';
import { ScoutMapService } from './scout-map.service';
import { ScoutAiService } from './scout-ai.service';
import { ScoutAgentsService } from './scout-agents.service';

@Controller('scout')
@UseGuards(JwtAuthGuard)
export class ScoutController {
  constructor(
    private readonly scout: ScoutService,
    private readonly scoutMap: ScoutMapService,
    private readonly scoutAi: ScoutAiService,
    private readonly scoutAgents: ScoutAgentsService,
  ) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: JwtPayload) {
    const dashboard = await this.scout.getDashboard(user);
    try {
      const aiRecs = await this.scoutAi.getDashboardRecommendations(user);
      if (aiRecs?.length) {
        return { ...dashboard, aiRecs, aiPowered: true, recSource: 'openai' as const };
      }
    } catch {
      /* fallback rule-based recs from dashboard */
    }
    return { ...dashboard, aiPowered: false, recSource: 'rules' as const };
  }

  @Get('prospects')
  listProspects(@CurrentUser() user: JwtPayload) {
    return this.scout.listProspects(user);
  }

  @Get('prospects/:id')
  getProspect(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.scout.getProspect(user, id);
  }

  @Post('prospects')
  createProspect(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.scout.createProspect(user, body);
  }

  @Patch('prospects/:id')
  updateProspect(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.scout.updateProspect(user, id, body);
  }

  @Get('watchlist')
  listWatchlist(@CurrentUser() user: JwtPayload) {
    return this.scout.listWatchlist(user);
  }

  @Post('watchlist')
  addToWatchlist(
    @CurrentUser() user: JwtPayload,
    @Body() body: { prospectId: string; priority?: string },
  ) {
    return this.scout.addToWatchlist(user, body.prospectId, body.priority ?? 'B');
  }

  @Delete('watchlist/:prospectId')
  removeFromWatchlist(@CurrentUser() user: JwtPayload, @Param('prospectId') prospectId: string) {
    return this.scout.removeFromWatchlist(user, prospectId);
  }

  @Patch('watchlist/:prospectId/priority')
  updatePriority(
    @CurrentUser() user: JwtPayload,
    @Param('prospectId') prospectId: string,
    @Body() body: { priority: string },
  ) {
    return this.scout.updateWatchlistPriority(user, prospectId, body.priority);
  }

  @Post('watchlist/:prospectId/notes')
  addNote(
    @CurrentUser() user: JwtPayload,
    @Param('prospectId') prospectId: string,
    @Body() body: { text: string },
  ) {
    return this.scout.addWatchlistNote(user, prospectId, body.text);
  }

  @Delete('watchlist/:prospectId/notes/:index')
  removeNote(
    @CurrentUser() user: JwtPayload,
    @Param('prospectId') prospectId: string,
    @Param('index') index: string,
  ) {
    return this.scout.removeWatchlistNote(user, prospectId, Number(index));
  }

  @Get('reports')
  listReports(@CurrentUser() user: JwtPayload) {
    return this.scout.listReports(user);
  }

  @Post('reports')
  createReport(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.scout.createReport(user, body);
  }

  @Get('missions')
  listMissions(@CurrentUser() user: JwtPayload) {
    return this.scout.listMissions(user);
  }

  @Post('missions')
  createMission(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.scout.createMission(user, body);
  }

  @Get('map')
  getMapOverview(@CurrentUser() user: JwtPayload) {
    return this.scoutMap.getMapOverview(user);
  }

  @Get('map/continents/:continentId')
  getMapCountries(@CurrentUser() user: JwtPayload, @Param('continentId') continentId: string) {
    return this.scoutMap.getMapCountries(user, continentId);
  }

  @Get('map/countries/:countryId/teams')
  getMapTeams(@CurrentUser() user: JwtPayload, @Param('countryId') countryId: string) {
    return this.scoutMap.getMapTeams(user, countryId);
  }

  @Get('map/teams/:teamId/squad')
  getTeamSquad(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
    @Query('refresh') refresh?: string,
  ) {
    return this.scoutMap.getTeamSquad(user, teamId, refresh === '1' || refresh === 'true');
  }

  @Get('ai')
  getScoutAi(@CurrentUser() user: JwtPayload) {
    return this.scoutAi.getScoutAi(user);
  }

  @Post('ai/search')
  searchScoutAi(@CurrentUser() user: JwtPayload, @Body() body: { query: string }) {
    return this.scoutAi.searchScoutAi(user, body.query);
  }

  @Post('search')
  searchProspects(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      query?: string;
      position?: string;
      country?: string;
      ageRange?: string;
      potRange?: string;
      budgetRange?: string;
    },
  ) {
    return this.scoutAi.searchProspects(user, body);
  }

  @Get('agents/suggestions')
  suggestAgents(@CurrentUser() user: JwtPayload) {
    return this.scoutAgents.suggestAgents(user);
  }

  @Post('agents/search')
  searchAgents(@CurrentUser() user: JwtPayload, @Body() body: { query: string }) {
    return this.scoutAgents.searchAgents(user, body.query);
  }

  @Post('agents/add')
  addAgent(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.scoutAgents.addAgent(user, body);
  }

  @Get('agents')
  getAgents(@CurrentUser() user: JwtPayload, @Query('refresh') refresh?: string) {
    return this.scoutAgents.getAgents(user, refresh === '1' || refresh === 'true');
  }

  @Get('agents/:agentId/history')
  getAgentHistory(@CurrentUser() user: JwtPayload, @Param('agentId') agentId: string) {
    return this.scoutAgents.getAgentHistory(user, agentId);
  }

  @Get('agents/:agentId/contact')
  getAgentContactDraft(@CurrentUser() user: JwtPayload, @Param('agentId') agentId: string) {
    return this.scoutAgents.getContactDraft(user, agentId);
  }

  @Delete('agents/:agentId')
  removeAgent(@CurrentUser() user: JwtPayload, @Param('agentId') agentId: string) {
    return this.scoutAgents.removeAgent(user, agentId);
  }
}
