import z from 'zod';
import {
  ReferentielIdEnum,
  referentielIdEnumSchema,
} from '../referentiel-id.enum';
import { ActionTypeEnum, actionTypeSchema } from './action-type.enum';

export const listActionsRequestOptionsSchema = z
  .object({
    collectiviteId: z.optional(z.number()),
    actionIds: z
      .string()
      .array()
      .optional()
      .describe(
        'Liste des identifiants des mesures du référentiel à récupérer (ex : [cae_2.1, eci_1.1]).'
      ),
    actionTypes: actionTypeSchema
      .array()
      .optional()
      .describe(
        'Liste des types de mesure du référentiel à récupérer (ex : [action, sous_action]).'
      ),
    utilisateurPiloteIds: z
      .string()
      .array()
      .optional()
      .describe(
        "Liste des identifiants des utilisateurs pilotes permettant de récupérer les mesures pilotées par un d'eux."
      ),
    personnePiloteIds: z
      .number()
      .array()
      .optional()
      .describe(
        "Liste des identifiants des tags pilotes permettant de récupérer les mesures pilotées par un d'eux."
      ),
    servicePiloteIds: z
      .number()
      .array()
      .optional()
      .describe(
        "Liste des identifiants des services pilotes permettant de récupérer les mesures pilotées par un d'eux."
      ),
    referentielIds: z
      .array(referentielIdEnumSchema)
      .optional()
      .describe(
        'Liste des identifiants des référentiels à récupérer (ex : [cae, eci]).'
      ),
  })
  .prefault({
    actionTypes: [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION],
    referentielIds: [ReferentielIdEnum.CAE, ReferentielIdEnum.ECI],
  });

export type ListActionsInput = z.infer<typeof listActionsRequestOptionsSchema>;
