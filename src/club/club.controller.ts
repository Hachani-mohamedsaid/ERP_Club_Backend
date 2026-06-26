import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { ClubService } from './club.service';
import { PreparateurService } from './preparateur.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';

@Controller('club')
@UseGuards(JwtAuthGuard)
export class ClubController {
  constructor(
    private readonly club: ClubService,
    private readonly preparateur: PreparateurService,
  ) {}

  private ip(req: Request) {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
  }

  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.club.getProfile(user);
  }

  @Patch('profile')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Parametres', 'update')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.club.updateProfile(user, body as never, this.ip(req));
  }

  @Get('members')
  listMembers(@CurrentUser() user: JwtPayload) {
    return this.club.listMembers(user);
  }

  @Post('members')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Parametres', 'create')
  createMember(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.club.createMember(user, body as never, this.ip(req));
  }

  @Patch('members/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Parametres', 'update')
  updateMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.club.updateMember(user, id, body as never, this.ip(req));
  }

  @Delete('members/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Parametres', 'delete')
  deleteMember(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Req() req: Request) {
    return this.club.deleteMember(user, id, this.ip(req));
  }

  @Get('permissions')
  getPermissions(@CurrentUser() user: JwtPayload) {
    return this.club.getPermissions(user);
  }

  @Put('permissions')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Parametres', 'update')
  updatePermissions(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.club.updatePermissions(user, body as never, this.ip(req));
  }

  @Get('notifications')
  listNotifications(@CurrentUser() user: JwtPayload) {
    return this.club.listNotifications(user);
  }

  @Patch('notifications/read')
  markRead(@CurrentUser() user: JwtPayload, @Body() body: { ids?: string[] }) {
    return this.club.markNotificationsRead(user, body.ids);
  }

  @Delete('notifications/read')
  deleteRead(@CurrentUser() user: JwtPayload) {
    return this.club.deleteReadNotifications(user);
  }

  @Get('audit-logs')
  listAuditLogs(
    @CurrentUser() user: JwtPayload,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.club.listAuditLogs(user, { type, search });
  }

  @Get('players')
  listPlayers(@CurrentUser() user: JwtPayload) {
    return this.club.listPlayers(user);
  }

  @Post('players')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'create')
  createPlayer(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.club.createPlayer(user, body, this.ip(req));
  }

  @Patch('players/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'update')
  updatePlayer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.club.updatePlayer(user, id, body, this.ip(req));
  }

  @Delete('players/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'delete')
  deletePlayer(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Req() req: Request) {
    return this.club.deletePlayer(user, id, this.ip(req));
  }

  @Get('staff')
  listStaff(@CurrentUser() user: JwtPayload) {
    return this.club.listStaff(user);
  }

  @Post('staff')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Equipes', 'create')
  createStaff(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.club.createStaff(user, body, this.ip(req));
  }

  @Delete('staff/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Equipes', 'delete')
  deleteStaff(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteStaff(user, id);
  }

  @Patch('staff/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Equipes', 'update')
  updateStaff(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.club.updateStaff(user, id, body, this.ip(req));
  }

  @Get('finance')
  listFinance(@CurrentUser() user: JwtPayload) {
    return this.club.listFinance(user);
  }

  @Post('finance')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'create')
  createFinance(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.club.createFinanceEntry(user, body, this.ip(req));
  }

  @Get('contracts')
  listContracts(@CurrentUser() user: JwtPayload) {
    return this.club.listContracts(user);
  }

  @Post('contracts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Contrats', 'create')
  createContract(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.club.createContract(user, body, this.ip(req));
  }

  @Get('calendar')
  listCalendar(@CurrentUser() user: JwtPayload) {
    return this.club.listCalendarEvents(user);
  }

  @Post('calendar')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Calendrier', 'create')
  createCalendar(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.club.createCalendarEvent(user, body);
  }

  @Get('injuries')
  listInjuries(@CurrentUser() user: JwtPayload) {
    return this.club.listInjuries(user);
  }

  @Post('injuries')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Sante', 'create')
  createInjury(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.club.createInjury(user, body);
  }

  @Get('analytics')
  getAnalytics(@CurrentUser() user: JwtPayload) {
    return this.club.getAnalytics(user);
  }

  @Get('infrastructures')
  listInfrastructures(@CurrentUser() user: JwtPayload) {
    return this.club.listInfrastructures(user);
  }

  @Post('infrastructures')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Parametres', 'create')
  createInfrastructure(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.club.createInfrastructure(user, body);
  }

  // ─── Préparateur — Calendrier (même table que /club/calendar) ─

  @Get('preparateur/calendar')
  listPreparateurCalendar(@CurrentUser() user: JwtPayload) {
    return this.club.listCalendarEvents(user);
  }

  @Post('preparateur/calendar')
  createPreparateurCalendar(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.club.createCalendarEvent(user, body);
  }

  // ─── Préparateur — Condition Physique ─────────────────────────

  @Get('preparateur/condition')
  getPhysicalCondition(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getPhysicalCondition(user);
  }

  // ─── Préparateur — Dashboard ───────────────────────────────────

  @Get('preparateur/dashboard')
  getPreparateurDashboard(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getDashboard(user);
  }

  // ─── Préparateur — Charge Équipe ───────────────────────────────

  @Get('preparateur/charge')
  getChargeEquipe(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getChargeEquipe(user);
  }

  @Patch('preparateur/charge/:playerId/reduce')
  reducePlayerLoad(@CurrentUser() user: JwtPayload, @Param('playerId') playerId: string) {
    return this.preparateur.adjustPlayerLoad(user, playerId, -10);
  }

  @Patch('preparateur/charge/:playerId/increase')
  increasePlayerLoad(@CurrentUser() user: JwtPayload, @Param('playerId') playerId: string) {
    return this.preparateur.adjustPlayerLoad(user, playerId, +10);
  }

  @Put('preparateur/charge/:playerId')
  setPlayerLoad(
    @CurrentUser() user: JwtPayload,
    @Param('playerId') playerId: string,
    @Body() body: { loadScore: number; fatigueScore: number; recoveryScore?: number; notes?: string },
  ) {
    return this.preparateur.setPlayerLoad(user, playerId, body);
  }

  @Get('preparateur/charge/:playerId/history')
  getPlayerLoadHistory(@CurrentUser() user: JwtPayload, @Param('playerId') playerId: string) {
    return this.preparateur.getPlayerLoadHistory(user, playerId);
  }

  // ─── Préparateur — Risques Blessures ───────────────────────────

  @Get('preparateur/injury-risks')
  getInjuryRisks(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getInjuryRisks(user);
  }

  @Post('preparateur/injury-risks')
  createInjuryRisk(
    @CurrentUser() user: JwtPayload,
    @Body() body: { playerId: string; zone: string; risk: number; recommendation: string[]; medicalComment?: string; medicalAuthor?: string },
  ) {
    return this.preparateur.createInjuryRisk(user, body);
  }

  @Patch('preparateur/injury-risks/:id')
  updateInjuryRisk(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { zone?: string; risk?: number; recommendation?: string[]; medicalComment?: string; medicalAuthor?: string },
  ) {
    return this.preparateur.updateInjuryRisk(user, id, body);
  }

  @Delete('preparateur/injury-risks/:id')
  deleteInjuryRisk(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.preparateur.deleteInjuryRisk(user, id);
  }

  // ─── Préparateur — Sessions ─────────────────────────────────────

  @Get('preparateur/sessions')
  getSessions(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getSessions(user);
  }

  @Post('preparateur/sessions')
  createSession(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.preparateur.createSession(user, body as never);
  }

  @Patch('preparateur/sessions/:id')
  updateSession(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.preparateur.updateSession(user, id, body as never);
  }

  @Delete('preparateur/sessions/:id')
  deleteSession(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.preparateur.deleteSession(user, id);
  }

  // ─── Préparateur — Présence ─────────────────────────────────────

  @Get('preparateur/presence')
  getPresence(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getPresence(user);
  }

  @Patch('preparateur/presence/:playerId')
  updatePresence(
    @CurrentUser() user: JwtPayload,
    @Param('playerId') playerId: string,
    @Body() body: { status: string },
  ) {
    return this.preparateur.updatePresence(user, playerId, body.status);
  }
}
