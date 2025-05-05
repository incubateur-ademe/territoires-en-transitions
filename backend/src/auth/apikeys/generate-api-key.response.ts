import { z } from 'zod';

export const generateApiKeyResponseSchema = z.object({
  userId: z.string().uuid(),
  clientId: z.string(),
  clientSecret: z.string(),
  restrictedPermissions: z.string().array().nullish(),
});
export type GenerateApiKeyResponse = z.infer<
  typeof generateApiKeyResponseSchema
>;
