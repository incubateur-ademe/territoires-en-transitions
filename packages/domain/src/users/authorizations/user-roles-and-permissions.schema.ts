import * as z from 'zod/mini';
import { permissionOperationEnumSchema } from './permission-operation.enum.schema';
import {
  auditRoleSchema,
  collectiviteRoleSchema,
  platformRoleSchema,
} from './user-role.enum.schema';

const platformRolesAndPermissionsSchema = z.object({
  roles: z.array(platformRoleSchema),
  permissions: z.array(permissionOperationEnumSchema),
});

const collectiviteRolesAndPermissionsSchema = z.object({
  roles: z.array(collectiviteRoleSchema),
  permissions: z.array(permissionOperationEnumSchema),
  collectiviteId: z.number(),
  collectiviteNom: z.string(),
  collectiviteAccesRestreint: z.boolean(),
});

export type CollectiviteRolesAndPermissions = z.infer<
  typeof collectiviteRolesAndPermissionsSchema
>;

const auditRolesAndPermissionsSchema = z.object({
  roles: z.array(auditRoleSchema),
  permissions: z.array(permissionOperationEnumSchema),
  auditId: z.number(),
  collectiviteId: z.number(),
});

export const userRolesAndPermissionsSchema = z.object({
  ...platformRolesAndPermissionsSchema.shape,

  collectivites: z.array(collectiviteRolesAndPermissionsSchema),
  audits: z.array(auditRolesAndPermissionsSchema),
});

export type UserRolesAndPermissions = z.infer<
  typeof userRolesAndPermissionsSchema
>;
