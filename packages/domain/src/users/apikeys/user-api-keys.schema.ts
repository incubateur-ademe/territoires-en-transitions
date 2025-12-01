import * as z from 'zod/mini';

export const userApiKeySchema = z.object({
  clientId: z.string(),
  userId: z.uuid(),
  clientSecretHash: z.string(),
  clientSecretTruncated: z.string(),
  permissions: z.nullable(z.array(z.string())),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
});

export type UserApiKey = z.infer<typeof userApiKeySchema>;

export const userApiKeySchemaCreate = z.partial(userApiKeySchema, {
  permissions: true,
  createdAt: true,
  modifiedAt: true,
});

export type UserApiKeyCreate = z.infer<typeof userApiKeySchemaCreate>;
