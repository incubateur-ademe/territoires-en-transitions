import { collectiviteRoleSchema } from '@tet/domain/users';
import * as z from 'zod/mini';

export const utilisateurCollectiviteAccessTableSchema = z.object({
  id: z.number(),
  userId: z.uuid(),
  collectiviteId: z.number(),
  collectiviteNom: z.string(),
  collectiviteAccesRestreint: z.boolean(),
  createdAt: z.nullable(z.string()),
  modifiedAt: z.nullable(z.string()),
  isActive: z.boolean(),
  accessLevel: collectiviteRoleSchema,
  invitationId: z.nullable(z.uuid()),
});

export type UtilisateurCollectiviteAccessTable = z.infer<
  typeof utilisateurCollectiviteAccessTableSchema
>;
