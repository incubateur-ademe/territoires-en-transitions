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

const auditRolesAndPermissionsSchema = z.object({
  role: z.nullable(auditRoleSchema),
  permissions: z.array(permissionOperationEnumSchema),
  auditId: z.number(),
});

export type AuditRolesAndPermissions = z.infer<
  typeof auditRolesAndPermissionsSchema
>;

const collectiviteRolesAndPermissionsSchema = z.object({
  role: z.nullable(collectiviteRoleSchema),
  permissions: z.array(permissionOperationEnumSchema),
  collectiviteId: z.number(),
  collectiviteNom: z.string(),
  collectiviteAccesRestreint: z.boolean(),

  audits: z.array(auditRolesAndPermissionsSchema),
});

export type CollectiviteRolesAndPermissions = z.infer<
  typeof collectiviteRolesAndPermissionsSchema
>;

export const userRolesAndPermissionsSchema = z.object({
  ...platformRolesAndPermissionsSchema.shape,

  collectivites: z.array(collectiviteRolesAndPermissionsSchema),
});

export type UserRolesAndPermissions = z.infer<
  typeof userRolesAndPermissionsSchema
>;
