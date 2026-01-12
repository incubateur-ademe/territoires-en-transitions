import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';
export interface NotifyReportCompletedProps extends NotificationTemplate {
  reportName: string;
  reportUrl: string;
}
