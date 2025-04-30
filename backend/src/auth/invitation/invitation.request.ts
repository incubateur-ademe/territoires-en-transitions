import { z } from 'zod';
import { niveauAccesSchema } from '@/backend/auth/authorizations/roles/niveau-acces.enum';

export const invitationRequestSchema = z.object({
  collectiviteId : z.number(),
  email : z.string(),
  niveau : niveauAccesSchema,
  tagIds : z.number().array().optional(),
});

export type InvitationRequest = z.infer<typeof invitationRequestSchema>;
