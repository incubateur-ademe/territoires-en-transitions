import { createEnumObject } from '../../utils';

export const ParcoursLabellisationStatusValues = [
  'non_demandee',
  'demande_envoyee',
  'audit_en_cours',
  'audit_valide',
] as const;

export type ParcoursLabellisationStatus =
  (typeof ParcoursLabellisationStatusValues)[number];

export const ParcoursLabellisationStatusEnum = createEnumObject(
  ParcoursLabellisationStatusValues
);
