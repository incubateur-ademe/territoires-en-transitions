import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const PermissionLevelEnum = {
  LECTURE: 'lecture',
  EDITION_FICHES_INDICATEURS: 'edition_fiches_indicateurs',
  EDITION: 'edition',
  ADMIN: 'admin',
} as const;

export type PermissionLevel =
  (typeof PermissionLevelEnum)[keyof typeof PermissionLevelEnum];

export const orderedPermissionLevels = [
  PermissionLevelEnum.LECTURE,
  PermissionLevelEnum.EDITION_FICHES_INDICATEURS,
  PermissionLevelEnum.EDITION,
  PermissionLevelEnum.ADMIN,
] as const;

export const permissionLevelPgEnum = pgEnum(
  'niveau_acces',
  orderedPermissionLevels
);

export const permissionLevelSchema = z.enum(orderedPermissionLevels);
