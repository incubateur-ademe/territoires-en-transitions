import z from 'zod';

export const collectiviteModuleTypeEnumSchema = z.enum([
  // "Avancée des plans de la collectivité"
  'plan-action.list',
  // "Count by des actions (ex: suivi de l'avancement des actions = count by status)"
  'fiche-action.count-by',
]);
