import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [AuthModule],
  controllers: [PlatformController],
  providers: [PlatformService, SuperAdminGuard],
  exports: [PlatformService],
})
export class PlatformModule {}
