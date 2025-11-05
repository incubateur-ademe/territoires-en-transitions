import * as z from 'zod/mini';
import { collectiviteAccessLevelSchema } from './collectivite-access-level.enum.schema';
import { permissionOperationEnumSchema } from './permission-operation.enum.schema';

export const collectiviteAccessSchema = z.object({
  collectiviteId: z.number(),
  niveauAcces: z.nullable(collectiviteAccessLevelSchema),
  nom: z.string(),
  accesRestreint: z.boolean(),
  isRoleAuditeur: z.boolean(),
  isReadOnly: z.boolean(),
  isSimplifiedView: z.boolean(),
  permissions: z.array(permissionOperationEnumSchema),
});

export type CollectiviteAccess = z.infer<typeof collectiviteAccessSchema>;
