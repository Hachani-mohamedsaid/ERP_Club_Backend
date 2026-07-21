import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { ResponsableService } from './responsable.service';

@Controller('responsable')
@UseGuards(JwtAuthGuard)
export class ResponsableController {
  constructor(private readonly responsable: ResponsableService) {}

  private ip(req: Request) {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
  }

  @Get('validation')
  listValidation(@CurrentUser() user: JwtPayload) {
    return this.responsable.listValidation(user);
  }

  @Patch('validation/:id/decide')
  decideValidation(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' | 'return'; comment?: string },
    @Req() req: Request,
  ) {
    return this.responsable.decideValidation(user, id, body.action, body.comment, this.ip(req));
  }

  @Get('documents')
  listDocuments(@CurrentUser() user: JwtPayload) {
    return this.responsable.listDocuments(user);
  }

  @Post('documents')
  createDocument(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.responsable.createDocument(user, body, this.ip(req));
  }

  @Delete('documents/:id')
  deleteDocument(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Req() req: Request) {
    return this.responsable.deleteDocument(user, id, this.ip(req));
  }

  @Get('recruitment/prospects')
  listProspects(@CurrentUser() user: JwtPayload) {
    return this.responsable.listProspects(user);
  }

  @Get('recruitment/reports')
  listRecruitmentReports(@CurrentUser() user: JwtPayload) {
    return this.responsable.listRecruitmentReports(user);
  }

  @Get('recruitment/shortlist')
  listRecruitmentShortlist(@CurrentUser() user: JwtPayload) {
    return this.responsable.listRecruitmentShortlist(user);
  }

  @Post('recruitment/prospects')
  createProspect(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.responsable.createProspect(user, body, this.ip(req));
  }

  @Patch('recruitment/prospects/:id')
  updateProspect(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.responsable.updateProspect(user, id, body);
  }

  @Get('budget')
  getBudget(@CurrentUser() user: JwtPayload) {
    return this.responsable.getBudget(user);
  }

  @Post('budget/expenses')
  createExpense(
    @CurrentUser() user: JwtPayload,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.responsable.createExpense(user, body, this.ip(req));
  }

  @Patch('budget/expenses/:id/decide')
  decideExpense(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' },
    @Req() req: Request,
  ) {
    return this.responsable.decideExpense(user, id, body.action, this.ip(req));
  }
}
