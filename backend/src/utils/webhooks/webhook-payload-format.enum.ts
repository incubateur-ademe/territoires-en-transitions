import { createEnumObject } from '../enum.utils';

export const WebhookPayloadFormat = ['default', 'communs'] as const;

export const WebhookPayloadFormatEnum = createEnumObject(WebhookPayloadFormat);

export type WebhookPayloadFormatType =
  (typeof WebhookPayloadFormatEnum)[keyof typeof WebhookPayloadFormatEnum];
