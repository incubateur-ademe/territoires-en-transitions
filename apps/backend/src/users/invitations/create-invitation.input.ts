import { collectiviteRoleSchema } from '@tet/domain/users';
import { z } from 'zod';

export const createInvitationInputSchema = z.object({
  collectiviteId: z.number(),
  email: z.string(),
  accessLevel: collectiviteRoleSchema,
  tagIds: z.number().array().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;
