import { z } from 'zod';

/**
 * Snake case in the oauth2 spec, useful for swagger UI
 */
export const generateTokenRequestSchema = z.object({
  grant_type: z.enum(['client_credentials']),
  client_id: z.string(),
  client_secret: z.string(),
});

export const generateTokenRequestWithOptionalClientIdClientSecretSchema =
  generateTokenRequestSchema.partial({
    client_id: true,
    client_secret: true,
  });

export type GenerateTokenRequest = z.infer<typeof generateTokenRequestSchema>;
