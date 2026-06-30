import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { ScoutService } from './scout.service';
import { ScoutMapService } from './scout-map.service';
import { ScoutAiService } from './scout-ai.service';

@Controller('scout')
@UseGuards(JwtAuthGuard)
export class ScoutController {
  constructor(
    private readonly scout: ScoutService,
    private readonly scoutMap: ScoutMapService,
    private readonly scoutAi: ScoutAiService,
  ) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.scout.getDashboard(user);
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
}
