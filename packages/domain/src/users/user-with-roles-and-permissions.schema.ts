import z from 'zod';
import { userRolesAndPermissionsSchema } from './authorizations/user-roles-and-permissions.schema';
import { userInfoSchema } from './user-info.schema';

export const userWithRolesAndPermissionsSchema = z.object({
  ...userInfoSchema.shape,
  ...userRolesAndPermissionsSchema.shape,
});

export type UserWithRolesAndPermissions = z.infer<
  typeof userWithRolesAndPermissionsSchema
>;
