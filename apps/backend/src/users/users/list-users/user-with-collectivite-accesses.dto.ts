import { dcpSchema } from '@/backend/users/models/dcp.table';
import z from 'zod';
import { collectiviteAccessLevelSchema } from '../../authorizations/roles/collectivite-access-level.enum';
import { permissionOperationEnumSchema } from '../../authorizations/permission-operation.enum';

export const collectiviteAccessSchema = z.object({
  collectiviteId: z.number(),
  niveauAcces: collectiviteAccessLevelSchema.nullable(),
  nom: z.string(),
  accesRestreint: z.boolean(),
  isRoleAuditeur: z.boolean(),
  isReadOnly: z.boolean(),
  isSimplifiedView: z.boolean(),
  permissions: z.array(permissionOperationEnumSchema),
});

export type CollectiviteAccess = z.infer<typeof collectiviteAccessSchema>;

export const UserWithCollectiviteAccessesSchema = dcpSchema
  .pick({
    nom: true,
    prenom: true,
    email: true,
    telephone: true,
    cguAccepteesLe: true,
  })
  .extend({
    id: z.string(),
    newEmail: z.string().optional().nullable(),
    isVerified: z.boolean(),
    isSupport: z.boolean(),
    collectivites: collectiviteAccessSchema.array(),
  });

export type UserWithCollectiviteAccesses = z.infer<
  typeof UserWithCollectiviteAccessesSchema
>;
