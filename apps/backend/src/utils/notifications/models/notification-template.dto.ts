import { Result } from '@tet/backend/utils/result.type';
import { type Notification } from '@tet/domain/utils';
import { ReactNode } from 'react';

/**  Interface commune aux notifications */
export interface NotificationTemplate {
  sendToEmail: string;
  subject: string;
}

export type GetNotificationContent = NotificationTemplate & {
  content: ReactNode;
};

export type GetNotificationContentResult = Result<
  GetNotificationContent,
  string
>;

export type NotificationContentGenerator = (
  notification: Notification
) => Promise<GetNotificationContentResult>;
