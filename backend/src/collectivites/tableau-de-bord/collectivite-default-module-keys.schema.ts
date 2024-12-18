import z from 'zod';

export const collectiviteDefaultModuleKeysSchema = z.enum([
  'suivi-plan-actions',
  'fiche-actions-par-statut',
  'fiche-actions-par-personne-pilote',
  'fiche-actions-par-elu-referent',
  'fiche-actions-par-priorite',
]);

export type CollectiviteDefaultModuleKeys = z.infer<
  typeof collectiviteDefaultModuleKeysSchema
>;
