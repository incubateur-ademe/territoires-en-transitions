import { dcpSchema } from '@/backend/users/models/dcp.table';
import z from 'zod';
import { permissionOperationEnumSchema } from '../../index-domain';

export const collectiviteAccessSchema = z.object({
  collectiviteId: z.number(),
  permissionLevel: z.string().optional(),
  nom: z.string().optional(),
  accesRestreint: z.boolean().optional().nullable(),
  isRoleAuditeur: z.boolean(),
  isReadOnly: z.boolean(),
  permissions: z.array(permissionOperationEnumSchema).optional(),
});

export type CollectiviteAccess = z.infer<typeof collectiviteAccessSchema>;

export const userInfoResponseSchema = dcpSchema
  .pick({
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
  })
  .extend({
    id: z.string(),
    isVerified: z.boolean().optional().nullable(),
    isSupport: z.boolean().optional().nullable(),
    collectivites: collectiviteAccessSchema.array().optional(),
  });

export type UserInfoResponseType = z.infer<typeof userInfoResponseSchema>;
