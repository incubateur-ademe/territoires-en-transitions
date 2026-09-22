import { pertinenceEnumValues } from '@tet/domain/collectivites';
import { pgEnum } from 'drizzle-orm/pg-core';

export const levierPertinencePgEnum = pgEnum(
  'levier_pertinence',
  pertinenceEnumValues
);
