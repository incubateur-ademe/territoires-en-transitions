import { orderedCollectiviteAccessLevels } from '@tet/domain/users';
import { pgEnum } from 'drizzle-orm/pg-core';

export const collectiviteAccessLevelPgEnum = pgEnum(
  'niveau_acces',
  orderedCollectiviteAccessLevels
);
