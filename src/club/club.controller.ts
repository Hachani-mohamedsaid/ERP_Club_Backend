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
import { ClubAiChatDto } from './dto/club-ai-chat.dto';

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

  @Get('players/:id')
  getPlayer(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.getPlayer(user, id);
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

  @Get('training')
  getTraining(@CurrentUser() user: JwtPayload) {
    return this.club.getTrainingOverview(user);
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

  @Patch('injuries/:id')
  @UseGuards(JwtAuthGuard)
  updateInjury(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.updateInjury(user, id, body);
  }

  @Delete('injuries/:id')
  @UseGuards(JwtAuthGuard)
  deleteInjury(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteInjury(user, id);
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

  // ─── Préparateur — Calendrier ────────────────────────────────────

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

  // ─── Préparateur — Comparaison ──────────────────────────────────

  @Get('preparateur/comparison')
  getComparisonPlayers(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getComparisonPlayers(user);
  }

  // ─── Préparateur — Match Readiness ─────────────────────────────

  @Get('preparateur/match-readiness')
  getMatchReadiness(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getMatchReadiness(user);
  }

  @Patch('preparateur/match-readiness/:playerId')
  updateMatchReadiness(
    @CurrentUser() user: JwtPayload,
    @Param('playerId') playerId: string,
    @Body() body: { readinessStatus: string },
  ) {
    return this.preparateur.updateMatchReadiness(user, playerId, body.readinessStatus);
  }

  // ─── Préparateur — Programmes ───────────────────────────────────

  @Get('preparateur/programs')
  getPrograms(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getPrograms(user);
  }

  @Post('preparateur/programs')
  createProgram(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.preparateur.createProgram(user, body as never);
  }

  @Patch('preparateur/programs/:id')
  updateProgram(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.preparateur.updateProgram(user, id, body as never);
  }

  @Delete('preparateur/programs/:id')
  deleteProgram(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.preparateur.deleteProgram(user, id);
  }

  @Get('preparateur/wellness')
  getWellness(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getWellness(user);
  }

  @Put('preparateur/wellness/:playerId')
  upsertWellness(
    @CurrentUser() user: JwtPayload,
    @Param('playerId') playerId: string,
    @Body() body: { sommeil: number; fatigue: number; stress: number; douleur: number; humeur: number },
  ) {
    return this.preparateur.upsertWellness(user, playerId, body);
  }

  @Get('preparateur/reports')
  getReports(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getReports(user);
  }

  @Get('preparateur/notifications')
  getNotifications(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getNotifications(user);
  }

  @Patch('preparateur/notifications/read-all')
  markAllNotificationsRead(@CurrentUser() user: JwtPayload) {
    return this.preparateur.markAllNotificationsRead(user);
  }

  @Patch('preparateur/notifications/:id/read')
  markNotificationRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.preparateur.markNotificationRead(user, id);
  }

  @Delete('preparateur/notifications/:id')
  deleteNotification(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.preparateur.deleteNotification(user, id);
  }

  @Get('preparateur/recovery')
  getRecoverySessions(@CurrentUser() user: JwtPayload) {
    return this.preparateur.getRecoverySessions(user);
  }

  @Post('preparateur/recovery')
  createRecoverySession(
    @CurrentUser() user: JwtPayload,
    @Body() body: { playerId: string; method: string; date: string; duration: string; notes?: string },
  ) {
    return this.preparateur.createRecoverySession(user, body);
  }

  @Patch('preparateur/recovery/:id')
  updateRecoverySession(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status?: string; notes?: string },
  ) {
    return this.preparateur.updateRecoverySession(user, id, body);
  }

  @Delete('preparateur/recovery/:id')
  deleteRecoverySession(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.preparateur.deleteRecoverySession(user, id);
  }

  // ─── Player Photo ────────────────────────────────────────────────

  @Patch('players/:id/photo')
  updatePlayerPhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { photoUrl: string },
  ) {
    return this.club.updatePlayerPhoto(user, id, body.photoUrl);
  }

  // ─── Player Stats ─────────────────────────────────────────────────

  @Get('players/:id/stats')
  getPlayerStats(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.getPlayerStats(user, id);
  }

  @Patch('players/:id/stats')
  updatePlayerStats(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.updatePlayerStats(user, id, body);
  }

  // ─── Player Physical Profile ────────────────────────────────────

  @Patch('players/:id/physical')
  updatePlayerPhysical(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.updatePlayerPhysical(user, id, body);
  }

  // ─── Player Appointment ─────────────────────────────────────────

  @Post('players/:id/appointment')
  bookAppointment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.bookPlayerAppointment(user, id, body);
  }

  // ─── Player Contract ───────────────────────────────────────────

  @Get('players/:id/contract')
  getPlayerContract(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.getPlayerContract(user, id);
  }

  // ─── Match Stats ──────────────────────────────────────────────

  @Get('players/:id/match-stats')
  getMatchStats(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.getMatchStats(user, id);
  }

  @Post('players/:id/match-stats')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'create')
  createMatchStat(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.createMatchStat(user, id, body);
  }

  // ─── Awards ──────────────────────────────────────────────────

  @Get('players/:id/awards')
  getAwards(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.getAwards(user, id);
  }

  @Post('players/:id/awards')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'create')
  createAward(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.createAward(user, id, body);
  }

  @Delete('awards/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'delete')
  deleteAward(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteAward(user, id);
  }

  // ─── Documents ──────────────────────────────────────────────

  @Get('players/:id/documents')
  getDocuments(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.getDocuments(user, id);
  }

  @Get('documents/:id/file')
  getDocumentFile(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.getDocumentFile(user, id);
  }

  @Post('players/:id/documents')
  createDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.createDocument(user, id, body);
  }

  @Delete('documents/:id')
  deleteDocument(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteDocument(user, id);
  }

  // ─── Transfers ──────────────────────────────────────────────

  @Get('transfers')
  getTransfers(@CurrentUser() user: JwtPayload) {
    return this.club.getTransfers(user);
  }

  @Post('transfers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'create')
  createTransfer(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.club.createTransfer(user, body);
  }

  @Delete('transfers/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'delete')
  deleteTransfer(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteTransfer(user, id);
  }

  // ─── Chemistry ──────────────────────────────────────────────

  @Get('chemistry')
  getChemistry(@CurrentUser() user: JwtPayload) {
    return this.club.getChemistry(user);
  }

  @Patch('chemistry/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Joueurs', 'update')
  updateChemistry(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { chemistry: number },
  ) {
    return this.club.updateChemistry(user, id, body.chemistry);
  }

  // ─── Finance CRUD extensions ────────────────────────────────

  @Patch('finance/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'update')
  updateFinanceEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.updateFinanceEntry(user, id, body);
  }

  @Delete('finance/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'delete')
  deleteFinanceEntry(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteFinanceEntry(user, id);
  }

  @Post('finance/seed')
  seedFinance(@CurrentUser() user: JwtPayload) {
    return this.club.seedFinanceDataIfEmpty(user);
  }

  @Get('finance/report')
  getFinanceReport(@CurrentUser() user: JwtPayload) {
    return this.club.getFinanceReport(user);
  }

  // ─── Contracts CRUD extensions ──────────────────────────────

  @Patch('contracts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Contrats', 'update')
  updateContract(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.updateContract(user, id, body);
  }

  @Delete('contracts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Contrats', 'delete')
  deleteContract(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteContract(user, id);
  }

  // ─── Sponsors ───────────────────────────────────────────────

  @Get('sponsors')
  listSponsors(@CurrentUser() user: JwtPayload) {
    return this.club.listSponsors(user);
  }

  @Post('sponsors')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'create')
  createSponsor(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.club.createSponsor(user, body);
  }

  @Patch('sponsors/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'update')
  updateSponsor(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.updateSponsor(user, id, body);
  }

  @Delete('sponsors/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'delete')
  deleteSponsor(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteSponsor(user, id);
  }

  // ─── Invoices ───────────────────────────────────────────────

  @Get('invoices')
  listInvoices(@CurrentUser() user: JwtPayload) {
    return this.club.listInvoices(user);
  }

  @Post('invoices')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'create')
  createInvoice(@CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.club.createInvoice(user, body);
  }

  @Patch('invoices/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'update')
  updateInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.club.updateInvoice(user, id, body);
  }

  @Patch('invoices/:id/pay')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'update')
  markInvoicePaid(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.markInvoicePaid(user, id);
  }

  @Delete('invoices/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('Finances', 'delete')
  deleteInvoice(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.club.deleteInvoice(user, id);
  }

  @Get('ai')
  getClubAi(@CurrentUser() user: JwtPayload) {
    return this.club.getClubAi(user);
  }

  @Post('ai/chat')
  chatClubAi(@CurrentUser() user: JwtPayload, @Body() dto: ClubAiChatDto) {
    return this.club.chatClubAi(user, dto);
  }
}
