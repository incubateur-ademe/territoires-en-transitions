import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/components';
import { and, eq, lt } from 'drizzle-orm';
import { DateTime, DurationLike } from 'luxon';
import { EmailService } from '../shared/email/email.service';
import { DatabaseService } from '../utils/database/database.service';
import { NotificationStatusEnum } from './models/notification-status.enum';
import { GetNotificationContent } from './models/notification-template.dto';
import { Notification, notificationTable } from './models/notification.table';
import { NotificationContentService } from './notification-content.service';

const DEFAULT_DELAY_BEFORE_SENDING: DurationLike = { minutes: 15 };
const MAX_SEND_RETRIES = 5;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationHandlersService: NotificationContentService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Charge et envoi les notifications
   */
  async sendPendingNotifications() {
    try {
      const pendingNotifications = await this.getPendingNotificationsToSend(
        DEFAULT_DELAY_BEFORE_SENDING
      );

      if (pendingNotifications.length > 0) {
        await Promise.all(
          pendingNotifications.map((notification) =>
            this.sendNotification(notification)
          )
        );
      }
    } catch (error) {
      this.logger.log(
        `sendPendingNotifications error: ${JSON.stringify(error)}`
      );
    }
  }

  /**
   * Charge et envoi la notification
   */
  private async sendNotification(notification: Notification) {
    const ret = await this.notificationHandlersService.getNotificationContent(
      notification
    );
    if (!ret.success) {
      return;
    }

    return this.sendNotificationEmail({
      notification,
      notificationContent: ret.data,
    });
  }

  /**
   * Envoi la notification par mail et met à jour la notification dans la base
   */
  private async sendNotificationEmail({
    notification,
    notificationContent,
  }: {
    notification: Notification;
    notificationContent: GetNotificationContent;
  }) {
    // fait le rendu html du mail
    const { sendToEmail, subject, content } = notificationContent;
    const html = await render(content);

    // essaye d'envoyer le mail
    const sendMailResult = await this.emailService.sendEmail({
      to: sendToEmail,
      subject,
      html,
    });

    // met à jour la notification dans la base
    await this.databaseService.db
      .update(notificationTable)
      .set(
        sendMailResult.success
          ? {
              status: NotificationStatusEnum.SENT,
              sentToEmail: sendToEmail,
              sentAt: DateTime.now().toUTC().toSQL(),
            }
          : {
              status:
                sendMailResult.error.status === 'pending' &&
                notification.retries < MAX_SEND_RETRIES - 1
                  ? NotificationStatusEnum.PENDING
                  : NotificationStatusEnum.FAILED,
              sentToEmail: sendToEmail,
              retries: notification.retries + 1,
              errorMessage: sendMailResult.error.errorMessage,
            }
      )
      .where(eq(notificationTable.id, notification.id));
  }

  /**
   * Charge les notifications à envoyer, c-à-d celles dont :
   * - le statut est "pending"
   * - et le nombre de retries maximum n'est pas atteint
   * - et qui ont été ajouté depuis plus d'un certain délai
   */
  private getPendingNotificationsToSend(delayBeforeSending: DurationLike) {
    const now = DateTime.now();
    const minCreatedAt = now.minus(delayBeforeSending).toUTC().toString();

    return this.databaseService.db
      .select()
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.status, NotificationStatusEnum.PENDING),
          lt(notificationTable.retries, MAX_SEND_RETRIES),
          lt(notificationTable.createdAt, minCreatedAt)
        )
      );
  }
}
