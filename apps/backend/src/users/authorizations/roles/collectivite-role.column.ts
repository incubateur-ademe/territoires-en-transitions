import { collectiviteRoleEnumValues } from '@tet/domain/users';
import { pgEnum } from 'drizzle-orm/pg-core';

export const collectiviteRolePgEnum = pgEnum(
  'niveau_acces',
  collectiviteRoleEnumValues
);
