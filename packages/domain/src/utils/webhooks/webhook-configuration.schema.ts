import * as z from 'zod/mini';
import { applicationSousScopesEnumSchema } from '../application-domains.enum';
import { createEnumObject } from '../enum.utils';

const webhookAuthenticationMethodEnumValues = ['bearer', 'basic'] as const;
const webhookAuthenticationMethodEnumSchema = z.enum(
  webhookAuthenticationMethodEnumValues
);
export const WebhookAuthenticationMethodEnum = createEnumObject(
  webhookAuthenticationMethodEnumValues
);
export type WebhookAuthenticationMethod = z.infer<
  typeof webhookAuthenticationMethodEnumSchema
>;

const webhookPayloadFormatEnumValues = ['default', 'communs'] as const;
const webhookPayloadFormatEnumSchema = z.enum(webhookPayloadFormatEnumValues);
export const WebhookPayloadFormatEnum = createEnumObject(
  webhookPayloadFormatEnumValues
);
export type WebhookPayloadFormat = z.infer<
  typeof webhookPayloadFormatEnumSchema
>;

export const webhookConfigurationSchema = z.object({
  ref: z.string(),
  entityType: applicationSousScopesEnumSchema,
  url: z.string(),
  authenticationMethod: webhookAuthenticationMethodEnumSchema,
  payloadFormat: webhookPayloadFormatEnumSchema,
  secretKey: z.string(),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type WebhookConfiguration = z.infer<typeof webhookConfigurationSchema>;

export const webhookConfigurationCreateSchema = z.object({
  ref: z.string(),
  entityType: applicationSousScopesEnumSchema,
  url: z.string(),
  authenticationMethod: webhookAuthenticationMethodEnumSchema,
  payloadFormat: z.optional(webhookPayloadFormatEnumSchema),
  secretKey: z.string(),
  createdAt: z.optional(z.iso.datetime()),
  modifiedAt: z.optional(z.iso.datetime()),
});

export type WebhookConfigurationCreate = z.infer<
  typeof webhookConfigurationCreateSchema
>;
