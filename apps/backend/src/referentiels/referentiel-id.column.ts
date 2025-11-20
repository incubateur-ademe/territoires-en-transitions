import { referentielIdEnumValues } from '@tet/domain/referentiels';
import { pgEnum } from 'drizzle-orm/pg-core';

export const referentielIdPgEnum = pgEnum(
  'referentiel',
  referentielIdEnumValues
);
