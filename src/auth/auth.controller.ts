import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Content-Type: multipart/form-data
   * Fields: fullName, clubName, country, league, email, phone,
   *         password, confirmPassword, invitationCode?, acceptTerms, acceptPrivacy
   * File: clubLogo (optional)
   */
  @Post('register')
  @UseInterceptors(
    FileInterceptor('clubLogo', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  register(
    @Body() dto: RegisterOrganizationDto,
    @UploadedFile() clubLogo?: Express.Multer.File,
  ) {
    return this.authService.registerOrganization(dto, clubLogo);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
    return this.authService.login(dto, ip);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }
}
