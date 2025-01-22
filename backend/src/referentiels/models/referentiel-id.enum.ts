import { pgEnum } from 'drizzle-orm/pg-core';
import z from 'zod';

// export enum ReferentielId {
//   ECI = 'eci',
//   CAE = 'cae',
//   TE = 'te',
//   TE_TEST = 'te-test',
// }

export const referentielIdEnumValues = ['cae', 'eci', 'te', 'te-test'] as const;

export const referentielIdEnumSchema = z.enum(referentielIdEnumValues);

export type ReferentielId = z.infer<typeof referentielIdEnumSchema>;

// Todo: to be removed
export const referentielIdPgEnum = pgEnum(
  'referentiel',
  referentielIdEnumValues
);
