import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClubModule } from './club/club.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PlatformModule } from './platform/platform.module';
import { AnalysteModule } from './analyste/analyste.module';
import { ResponsableModule } from './responsable/responsable.module';
import { JoueurModule } from './joueur/joueur.module';
import { ScoutModule } from './scout/scout.module';
import { RecruteurModule } from './recruteur/recruteur.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClubModule,
    OrganizationsModule,
    UsersModule,
    PlatformModule,
    AnalysteModule,
    ResponsableModule,
    JoueurModule,
    ScoutModule,
    RecruteurModule,
    MessagesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
