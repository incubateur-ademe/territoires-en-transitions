import { CollectiviteRolesAndPermissions } from './user-roles-and-permissions.schema';

// export const collectiviteAccessSchema = z.object({
//   collectiviteId: z.number(),
//   niveauAcces: z.nullable(collectiviteRoleSchema),
//   nom: z.string(),
//   accesRestreint: z.boolean(),
//   isRoleAuditeur: z.boolean(),
//   isReadOnly: z.boolean(),
//   isSimplifiedView: z.boolean(),
//   permissions: z.array(permissionOperationEnumSchema),
// });

// TODO temporary type to avoid massive renaming changes in front app
export type CollectiviteAccess = CollectiviteRolesAndPermissions;
