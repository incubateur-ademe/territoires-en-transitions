import { orderedCollectiviteAccessLevels } from '@/domain/users';
import { pgEnum } from 'drizzle-orm/pg-core';

export const collectiviteAccessLevelPgEnum = pgEnum(
  'niveau_acces',
  orderedCollectiviteAccessLevels
);
