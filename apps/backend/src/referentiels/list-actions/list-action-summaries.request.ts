import { actionTypeSchema } from '@/backend/referentiels/models/action-type.enum';
import { referentielIdEnumSchema } from '@/backend/referentiels/models/referentiel-id.enum';
import z from 'zod';

export const listActionSummariesRequestSchema = z.object({
  collectiviteId: z
    .number()
    .positive()
    .describe('Identifiant de la collectivité.'),
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
