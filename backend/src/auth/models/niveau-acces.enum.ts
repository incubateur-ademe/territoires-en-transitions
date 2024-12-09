import { pgEnum } from 'drizzle-orm/pg-core';

export enum NiveauAcces {
  LECTURE = 'lecture',
  EDITION = 'edition',
  ADMIN = 'admin',
}

export const niveauAccessOrdonne = [
  NiveauAcces.LECTURE,
  NiveauAcces.EDITION,
  NiveauAcces.ADMIN,
] as const;

export const niveauAccessEnum = pgEnum('niveau_acces', niveauAccessOrdonne);
