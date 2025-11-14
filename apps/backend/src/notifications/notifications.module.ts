import { Module } from '@nestjs/common';
import { FichesModule } from '../plans/fiches/fiches.module';
import { EmailService } from '../shared/email/email.service';
import { NotificationContentService } from './notification-content.service';
import { NotificationsFicheService } from './notifications-fiche.service';
import { NotificationsRouter } from './notifications.router';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [FichesModule],
  providers: [
    EmailService,
    NotificationsService,
    NotificationContentService,
    NotificationsFicheService,
    NotificationsRouter,
  ],
  exports: [NotificationsService, NotificationsFicheService, NotificationsRouter],
})
export class NotificationsModule {}
