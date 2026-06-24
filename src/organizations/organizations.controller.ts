import { Controller, Get, Param, Query } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(':id/dashboard')
  getDashboard(@Param('id') id: string, @Query('email') email: string) {
    return this.organizationsService.getDashboard(id, email);
  }
}
