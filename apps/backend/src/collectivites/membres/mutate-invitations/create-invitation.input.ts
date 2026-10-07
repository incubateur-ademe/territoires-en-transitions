import { collectiviteRoleSchema } from '@tet/domain/users';
import { z } from 'zod';

export const createInvitationInputSchema = z.object({
  collectiviteId: z.number(),
  /**
   * Normalisé : le rapprochement avec un compte existant se fait par égalité
   * stricte sur `dcp.email`, et une casse différente y créait une seconde
   * invitation pour quelqu'un qui a déjà un compte.
   */
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ pattern: z.regexes.unicodeEmail })),
  role: collectiviteRoleSchema,
  tagIds: z.number().array().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;
