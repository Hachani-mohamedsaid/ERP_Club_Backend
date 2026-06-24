import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt-payload.interface';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(':id/dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.organizationsService.getDashboard(id, user);
  }
}
