import { getEnumValues } from '@/backend/utils/enum.utils';
import { pgEnum } from 'drizzle-orm/pg-core';
import z from 'zod';

export const ReferentielIdEnum = {
  CAE: 'cae',
  ECI: 'eci',
  TE: 'te',
  TE_TEST: 'te-test',
} as const;

export const referentielIdEnumValues = getEnumValues(ReferentielIdEnum);

export const referentielIdEnumSchema = z.enum(referentielIdEnumValues);

export type ReferentielId = z.infer<typeof referentielIdEnumSchema>;

// Todo: to be removed
export const referentielIdPgEnum = pgEnum(
  'referentiel',
  referentielIdEnumValues
);
