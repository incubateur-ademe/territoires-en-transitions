export const disableableFieldValues = [
  'description',
  'objectifs',
  'structure pilote',
  'direction ou service pilote',
  'personne pilote',
  'budget',
  'statut',
  'date de début',
  'date de fin',
] as const;

export type DisableableField = (typeof disableableFieldValues)[number];
