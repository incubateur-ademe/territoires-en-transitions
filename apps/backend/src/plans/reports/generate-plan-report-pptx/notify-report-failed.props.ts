import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';
export interface NotifyReportFailedProps extends NotificationTemplate {
  reportName: string;
}
