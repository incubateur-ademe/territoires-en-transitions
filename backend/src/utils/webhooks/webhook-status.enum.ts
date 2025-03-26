import { createEnumObject } from '../enum.utils';

export const WebhookStatus = ['pending', 'success', 'error'] as const;

export const WebhookStatusEnum = createEnumObject(WebhookStatus);

export type WebhookStatusType = (typeof WebhookStatus)[number];
