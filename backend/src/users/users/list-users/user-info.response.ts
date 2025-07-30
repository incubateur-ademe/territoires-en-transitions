import { utilisateurPermissionAvecNomSchema } from '@/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { dcpSchema } from '@/backend/users/models/dcp.table';
import z from 'zod';

export const userInfoResponseSchema = dcpSchema
  .pick({
    userId: true,
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
  })
  .extend({
    isVerified: z.boolean().optional().nullable(),
    isSupport: z.boolean().optional().nullable(),
    permissions: utilisateurPermissionAvecNomSchema
      .pick({
        collectiviteId: true,
        isActive: true,
        permissionLevel: true,
        collectiviteNom: true,
      })
      .array()
      .optional(),
  });

export type UserInfoResponseType = z.infer<typeof userInfoResponseSchema>;
