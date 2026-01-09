import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

// données attendues par le template
export interface NotifyReportCompletedProps extends NotificationTemplate {
  reportName: string;
  reportUrl: string;
}
