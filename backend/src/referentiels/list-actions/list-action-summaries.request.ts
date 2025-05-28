import z from 'zod';
import { actionTypeSchema, referentielIdEnumSchema } from '../index-domain';

export const listActionSummariesRequestSchema = z.object({
  referentielId: referentielIdEnumSchema.describe(
    'Identifiant du référentiel à récupérer (ex : cae).'
  ),
  actionTypes: actionTypeSchema
    .array()
    .describe(
      'Liste des types de mesure du référentiel à récupérer (ex : [action, sous_action]).'
    ),
  identifiant: z
    .string()
    .optional()
    .describe(
      'Identifiant optionnel de la mesure, et ses éventuels descendants, à renvoyer (ex: 1.2.3)'
    ),
});

export type ListActionSummariesRequestType = z.infer<
  typeof listActionSummariesRequestSchema
>;
