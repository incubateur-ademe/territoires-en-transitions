import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const PermissionLevelEnum = {
  LECTURE: 'lecture',
  EDITION: 'edition',
  ADMIN: 'admin',
} as const;

export type PermissionLevel =
  (typeof PermissionLevelEnum)[keyof typeof PermissionLevelEnum];

export const orderedPermissionLevels = [
  PermissionLevelEnum.LECTURE,
  PermissionLevelEnum.EDITION,
  PermissionLevelEnum.ADMIN,
] as const;

export const permissionLevelPgEnum = pgEnum(
  'niveau_acces',
  orderedPermissionLevels
);

export const permissionLevelSchema = z.enum(orderedPermissionLevels);
