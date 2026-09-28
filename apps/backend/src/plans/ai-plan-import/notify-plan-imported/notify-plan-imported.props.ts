import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

export interface NotifyPlanImportedProps extends NotificationTemplate {
  planName: string;
  planRecap?: string;
  planUrl: string;
}
