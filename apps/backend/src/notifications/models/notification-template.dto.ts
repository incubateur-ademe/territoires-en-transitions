import { MethodResult } from '@/backend/utils/result.type';
import { ReactNode } from 'react';

/**  Interface commune aux notifications */
export interface NotificationTemplate {
  sendToEmail: string;
  subject: string;
}

export type GetNotificationContent = NotificationTemplate & {
  content: ReactNode;
};

export type GetNotificationContentResult = MethodResult<
  GetNotificationContent,
  string
>;
