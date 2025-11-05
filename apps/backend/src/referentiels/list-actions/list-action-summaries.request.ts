import {
  actionTypeSchema,
  referentielIdEnumSchema,
} from '@tet/domain/referentiels';
import z from 'zod';

export const listActionSummariesRequestSchema = z.object({
  collectiviteId: z
    .number()
    .positive()
    .describe('Identifiant de la collectivité.'),
  referentielId: referentielIdEnumSchema,
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
