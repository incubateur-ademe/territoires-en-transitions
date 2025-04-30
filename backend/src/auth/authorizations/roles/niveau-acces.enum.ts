import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export enum PermissionLevel {
  LECTURE = 'lecture',
  EDITION = 'edition',
  ADMIN = 'admin',
}

export const orderedPermissionLevels = [
  PermissionLevel.LECTURE,
  PermissionLevel.EDITION,
  PermissionLevel.ADMIN,
] as const;

export const niveauAccessEnum = pgEnum('niveau_acces', orderedPermissionLevels);

export const niveauAccesSchema = z.enum(orderedPermissionLevels);
