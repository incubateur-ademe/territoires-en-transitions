import { pgEnum } from 'drizzle-orm/pg-core';

export enum ReferentielType {
  ECI = 'eci',
  CAE = 'cae',
  TE = 'te',
  TE_TEST = 'te-test',
}
// WARNING: not using Object.values to use it with pgTable
export const referentielList = [
  ReferentielType.CAE,
  ReferentielType.ECI,
  ReferentielType.TE,
  ReferentielType.TE_TEST,
] as const;

// Todo: to be removed
export const referentielEnum = pgEnum('referentiel', referentielList);
