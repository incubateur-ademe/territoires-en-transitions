import z from 'zod';

export const collectiviteDefaultModuleKeysSchema = z.enum([
  'suivi-plan-actions',
  'fiche-actions-par-statut',
  'fiche-actions-par-personne-pilote',
  'fiche-actions-par-indicateurs-associes',
  'fiche-actions-par-priorite',
]);

export type CollectiviteDefaultModuleKeys = z.infer<
  typeof collectiviteDefaultModuleKeysSchema
>;
