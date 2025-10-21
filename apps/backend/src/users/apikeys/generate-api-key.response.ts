import { z } from 'zod';

export const generateApiKeyResponseSchema = z.object({
  userId: z.uuid(),
  clientId: z.string(),
  clientSecret: z.string(),
  permissions: z.string().array().nullish(),
});
export type GenerateApiKeyResponse = z.infer<
  typeof generateApiKeyResponseSchema
>;
