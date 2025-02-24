import { pgEnum } from 'drizzle-orm/pg-core';

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
