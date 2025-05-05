import { z } from 'zod';

export const generateTokenResponseSchema = z.object({
  tokenType: z.enum(['Bearer']),
  accessToken: z.string(),
  expiresIn: z
    .number()
    .int()
    .optional()
    .describe('Durée de vie du token en secondes'),
});
export type GenerateTokenResponse = z.infer<typeof generateTokenResponseSchema>;
