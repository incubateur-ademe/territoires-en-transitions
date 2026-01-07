import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

// données attendues par le template
export interface NotifyReportFailedProps extends NotificationTemplate {
  reportName: string;
}
