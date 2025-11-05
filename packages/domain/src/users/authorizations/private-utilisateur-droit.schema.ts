import * as z from 'zod/mini';
import { collectiviteAccessLevelSchema } from './collectivite-access-level.enum.schema';

export const utilisateurCollectiviteAccessSchema = z.object({
  id: z.number(),
  userId: z.uuid(),
  collectiviteId: z.number(),
  createdAt: z.nullable(z.string()),
  modifiedAt: z.nullable(z.string()),
  isActive: z.boolean(),
  accessLevel: collectiviteAccessLevelSchema,
  invitationId: z.nullable(z.uuid()),
});

export const utilisateurCollectiviteAccessAvecNomSchema = z.object({
  ...utilisateurCollectiviteAccessSchema.shape,

  collectiviteNom: z.string(),
  collectiviteAccesRestreint: z.nullable(z.boolean()),
});

export type UtilisateurCollectiviteAccess = z.infer<
  typeof utilisateurCollectiviteAccessAvecNomSchema
>;
