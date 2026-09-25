import { Injectable, Logger } from '@nestjs/common';
import GetPlanUrlService from '@tet/backend/plans/utils/get-plan-url.service';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { failure, success } from '@tet/backend/utils/result.type';
import {
  Notification,
  NotificationStatusEnum,
  NotifiedOnEnum,
} from '@tet/domain/utils';
import { z } from 'zod';
import NotifyPlanImportedEmail from './notify-plan-imported.email';

/** Format du champ `notificationData`. */
const planImportedNotificationDataSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
  planName: z.string(),
});

type PlanImportedNotificationData = z.infer<
  typeof planImportedNotificationDataSchema
>;

/**
 * Prévient qui a lancé un import IA que son plan est créé et attend d'être
 * vérifié. Le message part par le circuit des notifications en attente.
 */
@Injectable()
export class NotifyPlanImportedService {
  private readonly logger = new Logger(NotifyPlanImportedService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly listUsersService: ListUsersService,
    private readonly getPlanUrlService: GetPlanUrlService
  ) {
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum['PLANS.AI_IMPORT.PLAN_IMPORTED'],
      (notification) => this.getNotificationContent(notification)
    );
  }

  async notifyPlanImported({
    createdBy,
    ...notificationData
  }: PlanImportedNotificationData & { createdBy: string }) {
    const created = await this.notificationsService.createPendingNotification({
      createdBy,
      status: NotificationStatusEnum.PENDING,
      sendTo: createdBy,
      entityId: String(notificationData.planId),
      notifiedOn: NotifiedOnEnum['PLANS.AI_IMPORT.PLAN_IMPORTED'],
      notificationData,
    });
    if (!created.success) {
      this.logger.error(
        `Notification du plan importé ${notificationData.planId} impossible : ${created.error}`
      );
    }
    return created;
  }

  async getNotificationContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    const parsed = planImportedNotificationDataSchema.safeParse(
      notification.notificationData
    );
    if (!parsed.success) {
      this.logger.error(
        `Données de notification illisibles : ${JSON.stringify(parsed.error)}`
      );
      return failure('PARSING_NOTIFICATION_DATA_ERROR');
    }
    const { collectiviteId, planId, planName } = parsed.data;

    const recipient = await this.listUsersService.getUserBasicInfo({
      userId: notification.sendTo,
    });
    if (!recipient) {
      return failure('USER_NOT_FOUND');
    }

    const sendToEmail = recipient.email;
    const subject = `Votre plan « ${planName} » est prêt : vérifiez-le`;
    return success({
      sendToEmail,
      subject,
      content: NotifyPlanImportedEmail({
        sendToEmail,
        subject,
        planName,
        planUrl: this.getPlanUrlService.getPlanUrl({ collectiviteId, planId }),
      }),
    });
  }
}
