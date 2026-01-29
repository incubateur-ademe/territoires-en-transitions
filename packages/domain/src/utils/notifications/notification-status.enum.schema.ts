import { z } from 'zod';
import { createEnumObject } from '../enum.utils';

export const notificationStatusValues = ['pending', 'sent', 'failed'] as const;

export const NotificationStatusEnum = createEnumObject(
  notificationStatusValues
);

export const notificationStatusSchema = z.enum(notificationStatusValues);

export type NotificationStatus = z.infer<typeof notificationStatusSchema>;
