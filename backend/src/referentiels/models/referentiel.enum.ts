import { pgEnum } from 'drizzle-orm/pg-core';
import z from 'zod';

export enum ReferentielType {
  ECI = 'eci',
  CAE = 'cae',
  TE = 'te',
  TE_TEST = 'te-test',
}
// WARNING: not using Object.values to use it with pgTable
export const referentielTypeEnumValues = [
  ReferentielType.CAE,
  ReferentielType.ECI,
  ReferentielType.TE,
  ReferentielType.TE_TEST,
] as const;

export const referentielTypeEnumSchema = z.enum(referentielTypeEnumValues);

// Todo: to be removed
export const referentielEnum = pgEnum('referentiel', referentielTypeEnumValues);
