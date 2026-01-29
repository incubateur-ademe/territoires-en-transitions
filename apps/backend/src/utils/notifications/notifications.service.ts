import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/components';
import {
  getErrorMessage,
  Notification,
  NotificationInsert,
  NotificationStatusEnum,
  NotifiedOn,
} from '@tet/domain/utils';
import { and, eq, lt, sql } from 'drizzle-orm';
import { DateTime, DurationLike } from 'luxon';
import { DatabaseService } from '../database/database.service';
import { Transaction } from '../database/transaction.utils';
import { EmailService } from '../email/email.service';
import { Result } from '../result.type';
import { CommonErrorEnum } from '../trpc/common-errors';
import {
  GetNotificationContent,
  NotificationContentGenerator,
} from './models/notification-template.dto';
import { notificationTable } from './models/notification.table';

const MAX_SEND_RETRIES = 5;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private registeredGenerator: Partial<
    Record<NotifiedOn, NotificationContentGenerator>
  > = {};

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Enregistre un générateur de contenu de notification
   */
  registerContentGenerator(
    notifiedOn: NotifiedOn,
    generator: NotificationContentGenerator
  ) {
    this.registeredGenerator[notifiedOn] = generator;
  }

  async createPendingNotification(
    notification: NotificationInsert,
    delayBeforeSending?: DurationLike
  ): Promise<Result<Notification, typeof CommonErrorEnum.DATABASE_ERROR>> {
    const result = await this.createPendingNotifications(
      [notification],
      delayBeforeSending
    );
    return result.success ? { success: true, data: result.data[0] } : result;
  }

  async createPendingNotifications(
    notifications: NotificationInsert[],
    delayBeforeSending?: DurationLike,
    tx?: Transaction
  ): Promise<Result<Notification[], typeof CommonErrorEnum.DATABASE_ERROR>> {
    const now = DateTime.now();
    const sendAfter = (delayBeforeSending ? now.plus(delayBeforeSending) : now)
      .toUTC()
      .toString();
    try {
      notifications.forEach((notification) => {
        notification.status = NotificationStatusEnum.PENDING;
        notification.sendAfter = sendAfter;
      });
      const createdNotifications = await (tx ?? this.databaseService.db)
        .insert(notificationTable)
        .values(notifications)
        .returning();
      return { success: true, data: createdNotifications };
    } catch (error) {
      this.logger.error(
        `Error creating pending notifications: ${getErrorMessage(error)}`
      );
      return { success: false, error: 'DATABASE_ERROR' };
    }
  }

  /**
   * Charge et envoi les notifications
   */
  async sendPendingNotifications() {
    try {
      const pendingNotifications = await this.getPendingNotificationsToSend();
      if (pendingNotifications.length > 0) {
        this.logger.log(`Sending ${pendingNotifications.length} notifications`);
        await Promise.all(
          pendingNotifications.map((notification) =>
            this.sendNotification(notification)
          )
        );
      } else {
        this.logger.log(`Nothing to send`);
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
    const contentGenerator = this.registeredGenerator[notification.notifiedOn];
    if (!contentGenerator) {
      return;
    }
    const ret = await contentGenerator(notification);
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
  private getPendingNotificationsToSend() {
    const now = DateTime.now().toUTC().toString();
    this.logger.log(
      `Getting pending notifications with sendAfter before: ${now}`
    );

    return this.databaseService.db
      .select()
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.status, NotificationStatusEnum.PENDING),
          lt(notificationTable.retries, MAX_SEND_RETRIES),
          lt(
            sql`COALESCE(${notificationTable.sendAfter}, ${notificationTable.createdAt})`,
            now
          )
        )
      );
  }
}
