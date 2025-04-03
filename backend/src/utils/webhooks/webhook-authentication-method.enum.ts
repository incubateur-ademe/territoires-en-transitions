import { createEnumObject } from '../enum.utils';

export const WebhookAuthenticationMethod = ['bearer', 'basic'] as const;

export const WebhookAuthenticationMethodEnum = createEnumObject(
  WebhookAuthenticationMethod
);

export type WebhookAuthenticationMethodType =
  (typeof WebhookAuthenticationMethodEnum)[keyof typeof WebhookAuthenticationMethodEnum];
