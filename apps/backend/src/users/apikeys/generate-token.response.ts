import { z } from 'zod';

/**
 * Snake case in the oauth2 spec
 */
export const generateTokenResponseSchema = z.object({
  token_type: z.enum(['Bearer']),
  access_token: z.string(),
  expires_in: z
    .number()
    .int()
    .optional()
    .describe('Durée de vie du token en secondes'),
});
export type GenerateTokenResponse = z.infer<typeof generateTokenResponseSchema>;
