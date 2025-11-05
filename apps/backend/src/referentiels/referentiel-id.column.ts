import { referentielIdEnumValues } from '@/domain/referentiels';
import { pgEnum } from 'drizzle-orm/pg-core';

export const referentielIdPgEnum = pgEnum(
  'referentiel',
  referentielIdEnumValues
);
