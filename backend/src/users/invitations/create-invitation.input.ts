import { permissionLevelSchema } from '@/backend/users/authorizations/roles/permission-level.enum';
import { z } from 'zod';

export const createInvitationInputSchema = z.object({
  collectiviteId: z.number(),
  email: z.string(),
  permissionLevel: permissionLevelSchema,
  tagIds: z.number().array().optional(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;
