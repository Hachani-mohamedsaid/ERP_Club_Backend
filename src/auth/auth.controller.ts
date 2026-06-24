import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';

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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
