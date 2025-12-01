import { createEnumObject } from '@tet/domain/utils';

export const NotificationStatus = ['pending', 'sent', 'failed'] as const;

export const NotificationStatusEnum = createEnumObject(NotificationStatus);

export type NotificationStatusType = (typeof NotificationStatus)[number];
