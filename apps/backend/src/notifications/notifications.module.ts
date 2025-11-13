import { Module } from '@nestjs/common';
import { FichesModule } from '../plans/fiches/fiches.module';
import { NotificationsFicheService } from './notifications-fiche.service';

@Module({
  imports: [FichesModule],
  providers: [NotificationsFicheService],
  exports: [NotificationsFicheService],
})
export class NotificationsModule {}
