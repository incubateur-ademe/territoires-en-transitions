import { collectiviteAccessLevelSchema } from '@/backend/users/authorizations/roles/collectivite-access-level.enum';
import { z } from 'zod';

export const createInvitationInputSchema = z.object({
  collectiviteId: z.number(),
  email: z.string(),
  accessLevel: collectiviteAccessLevelSchema,
  tagIds: z.number().array().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;
