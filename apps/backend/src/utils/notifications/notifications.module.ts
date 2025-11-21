import { Module } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { NotificationsRouter } from './notifications.router';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [],
  providers: [EmailService, NotificationsService, NotificationsRouter],
  exports: [NotificationsService, NotificationsRouter],
})
export class NotificationsModule {}
