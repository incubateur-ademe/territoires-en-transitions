import * as z from 'zod/mini';

const webhookStatusEnumValues = ['pending', 'success', 'error'] as const;
const webhookStatusEnumSchema = z.enum(webhookStatusEnumValues);
export type WebhookStatus = z.infer<typeof webhookStatusEnumSchema>;

export const webhookMessageSchema = z.object({
  id: z.uuid(),
  configurationRef: z.string(),
  payload: z.json(),
  sentPayload: z.nullable(z.json()),
  entityId: z.string(),
  response: z.nullable(z.json()),
  entityExternalId: z.nullable(z.string()),
  status: webhookStatusEnumSchema,
  error: z.nullable(z.string()),
  retryCount: z.number(),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type WebhookMessage = z.infer<typeof webhookMessageSchema>;

export const webhookMessageCreateSchema = z.partial(webhookMessageSchema, {
  id: true,
  sentPayload: true,
  response: true,
  entityExternalId: true,
  error: true,
  retryCount: true,
  createdAt: true,
  modifiedAt: true,
});

export type WebhookMessageCreate = z.infer<typeof webhookMessageCreateSchema>;
