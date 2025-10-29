import { pgEnum } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const CollectiviteAccessLevelEnum = {
  LECTURE: 'lecture',
  EDITION_FICHES_INDICATEURS: 'edition_fiches_indicateurs',
  EDITION: 'edition',
  ADMIN: 'admin',
} as const;

export type CollectiviteAccessLevel =
  (typeof CollectiviteAccessLevelEnum)[keyof typeof CollectiviteAccessLevelEnum];

export const orderedCollectiviteAccessLevels = [
  CollectiviteAccessLevelEnum.LECTURE,
  CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
  CollectiviteAccessLevelEnum.EDITION,
  CollectiviteAccessLevelEnum.ADMIN,
] as const;

export const collectiviteAccessLevelPgEnum = pgEnum(
  'niveau_acces',
  orderedCollectiviteAccessLevels
);

export const collectiviteAccessLevelSchema = z.enum(
  orderedCollectiviteAccessLevels
);
