import { z } from 'zod';

export const generateTokenRequestSchema = z.object({
  grantType: z.enum(['client_credentials']),
  clientId: z.string(),
  clientSecret: z.string(),
});
export type GenerateTokenRequest = z.infer<typeof generateTokenRequestSchema>;
