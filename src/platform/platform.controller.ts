import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { PlatformService } from './platform.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CreateSupportTicketDto, UpdateSupportTicketDto } from './dto/support-ticket.dto';

@Controller('platform')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Get('metrics')
  getMetrics() {
    return this.platform.getMetrics();
  }

  @Get('organizations')
  listOrganizations(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.platform.listOrganizations({ search, status });
  }

  @Get('organizations/:id')
  getOrganization(@Param('id') id: string) {
    return this.platform.getOrganization(id);
  }

  @Post('organizations')
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.platform.createOrganization(dto);
  }

  @Patch('organizations/:id')
  updateOrganization(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.platform.updateOrganization(id, dto);
  }

  @Post('organizations/:id/suspend')
  suspendOrganization(@Param('id') id: string) {
    return this.platform.suspendOrganization(id);
  }

  @Post('organizations/:id/reactivate')
  reactivateOrganization(@Param('id') id: string) {
    return this.platform.reactivateOrganization(id);
  }

  @Post('organizations/:id/activate-subscription')
  activateSubscription(
    @Param('id') id: string,
    @Body('method') method?: string,
  ) {
    return this.platform.activateSubscription(id, method);
  }

  @Post('organizations/:id/impersonate')
  impersonate(@Param('id') id: string) {
    return this.platform.impersonate(id);
  }

  @Get('users')
  listUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('club') club?: string,
  ) {
    return this.platform.listUsers({ role, status, club });
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean },
  ) {
    return this.platform.updateUser(id, body);
  }

  @Get('plans')
  listPlans() {
    return this.platform.listPlans();
  }

  @Get('subscriptions')
  listSubscriptions() {
    return this.platform.listSubscriptions();
  }

  @Get('payments')
  listPayments() {
    return this.platform.listPayments();
  }

  @Post('payments')
  recordPayment(@Body() dto: RecordPaymentDto) {
    return this.platform.recordPayment(dto);
  }

  @Get('settings')
  getSettings() {
    return this.platform.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.platform.updateSettings(body);
  }

  @Get('bi')
  getBi() {
    return this.platform.getBi();
  }

  @Get('support')
  getSupport(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.platform.getSupport({ status, search });
  }

  @Post('support')
  createSupportTicket(@Body() dto: CreateSupportTicketDto) {
    return this.platform.createSupportTicket(dto);
  }

  @Patch('support/:id')
  updateSupportTicket(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.platform.updateSupportTicket(id, dto);
  }

  @Get('security')
  getSecurity() {
    return this.platform.getSecurity();
  }

  @Get('notifications')
  getNotifications() {
    return this.platform.getNotifications();
  }
}
