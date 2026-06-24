import { Module } from '@nestjs/common';
import { ImgbbModule } from '../imgbb/imgbb.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ImgbbModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
