import { Injectable, Logger } from '@nestjs/common';
import { ListUsersService } from '@tet/backend/users/users/list-users/list-users.service';
import { NotificationStatusEnum } from '@tet/backend/utils/notifications/models/notification-status.enum';
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import {
  Notification,
  NotificationInsert,
} from '@tet/backend/utils/notifications/models/notification.table';
import { NotifiedOnEnum } from '@tet/backend/utils/notifications/models/notified-on.enum';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { Result } from '@tet/backend/utils/result.type';
import { z } from 'zod';
import GetPlanUrlService from '../../utils/get-plan-url.service';
import NotifyReportCompletedEmail from './notify-report-completed.email';
import { NotifyReportFailedEmail } from './notify-report-failed.email';
import { NotifyReportFailedProps } from './notify-report-failed.props';
import { NotifyReportError } from './notify-report.errors';

/** Format des données pour le champ `notificationData`  */
const reportNotificationDataSchema = z.object({
  collectiviteId: z.number(),
  planId: z.number(),
  createdBy: z.string(),
  reportId: z.string(),
  reportName: z.string(),
});

type ReportNotificationData = z.infer<typeof reportNotificationDataSchema>;

type ReportNotificationDataInsert = Omit<
  NotificationInsert,
  'notificationData'
> & {
  notificationData: ReportNotificationData;
};

export type ReportNotifiedOn =
  | (typeof NotifiedOnEnum)['PLANS.REPORTS.GENERATE_PLAN_REPORT_COMPLETED']
  | (typeof NotifiedOnEnum)['PLANS.REPORTS.GENERATE_PLAN_REPORT_FAILED'];

@Injectable()
export class NotifyReportService {
  private readonly logger = new Logger(NotifyReportService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly listUsersService: ListUsersService,
    private readonly getPlanUrlService: GetPlanUrlService
  ) {
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum['PLANS.REPORTS.GENERATE_PLAN_REPORT_COMPLETED'],
      (notification: Notification) =>
        this.getCompletedReportNotificationContent(notification)
    );
    this.notificationsService.registerContentGenerator(
      NotifiedOnEnum['PLANS.REPORTS.GENERATE_PLAN_REPORT_FAILED'],
      (notification: Notification) =>
        this.getFailedReportNotificationContent(notification)
    );
  }

  async createReportNotification(
    notificationType: ReportNotifiedOn,
    notificationData: ReportNotificationData
  ) {
    const notification: ReportNotificationDataInsert = {
      createdBy: notificationData.createdBy,
      entityId: String(notificationData.reportId),
      status: NotificationStatusEnum.PENDING,
      sendTo: notificationData.createdBy,
      notifiedOn: notificationType,
      notificationData: notificationData,
    };

    return this.notificationsService.createPendingNotification(notification);
  }

  /**
   * Charge les données et génère le contenu de la notification
   * (appelée lors de l'envoi des notifications)
   */
  async getCompletedReportNotificationContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    // charge les données
    const ret = await this.getReportNotificationTemplateData(
      notification,
      NotifiedOnEnum['PLANS.REPORTS.GENERATE_PLAN_REPORT_COMPLETED']
    );
    if (!ret.success) {
      this.logger.log(`getReportNotificationTemplateData error: ${ret.error}`);
      return ret;
    }
    const templateData = ret.data;

    const reportUrl = this.getPlanUrlService.getPlanDownloadReportUrl({
      collectiviteId: templateData.notificationData.collectiviteId,
      planId: templateData.notificationData.planId,
      reportId: templateData.notificationData.reportId,
    });

    const { sendToEmail, subject } = templateData.emailProps;
    return {
      success: true,
      data: {
        sendToEmail,
        subject,
        content: NotifyReportCompletedEmail({
          ...templateData.emailProps,
          reportUrl: reportUrl,
        }),
      },
    };
  }

  async getFailedReportNotificationContent(
    notification: Notification
  ): Promise<GetNotificationContentResult> {
    // charge les données
    const ret = await this.getReportNotificationTemplateData(
      notification,
      NotifiedOnEnum['PLANS.REPORTS.GENERATE_PLAN_REPORT_FAILED']
    );
    if (!ret.success) {
      this.logger.log(`getReportNotificationTemplateData error: ${ret.error}`);
      return ret;
    }

    const templateData = ret.data.emailProps;
    const { sendToEmail, subject } = templateData;
    return {
      success: true,
      data: {
        sendToEmail,
        subject,
        content: NotifyReportFailedEmail(templateData),
      },
    };
  }

  /**
   * Prépare les données nécessaires à l'envoi de la notification
   */
  private async getReportNotificationTemplateData(
    notification: Notification,
    notificationType: ReportNotifiedOn
  ): Promise<
    Result<
      {
        emailProps: NotifyReportFailedProps;
        notificationData: ReportNotificationData;
      },
      NotifyReportError
    >
  > {
    const { notificationData } = notification;

    const { data, success, error } =
      reportNotificationDataSchema.safeParse(notificationData);
    if (!success) {
      this.logger.error(
        `Parsing notification data error: ${JSON.stringify(error || {})}`
      );
      return { success: false, error: 'PARSING_NOTIFICATION_DATA_ERROR' };
    }

    const createdByUser = await this.listUsersService.getUserInfoById(
      data.createdBy
    );
    if (!createdByUser) {
      return {
        success: false,
        error: 'USER_NOT_FOUND',
      };
    }

    const emailProps: NotifyReportFailedProps = {
      sendToEmail: createdByUser.email,
      subject:
        notificationType ===
        NotifiedOnEnum['PLANS.REPORTS.GENERATE_PLAN_REPORT_COMPLETED']
          ? `Votre rapport de plan a été généré avec succès`
          : `Erreur lors de la génération du rapport de plan`,
      reportName: data.reportName,
    };

    return {
      success: true,
      data: {
        notificationData: data,
        emailProps,
      },
    };
  }
}
