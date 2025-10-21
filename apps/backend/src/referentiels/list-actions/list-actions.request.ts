import z from 'zod';
import { ActionTypeEnum, actionTypeSchema } from '../models/action-type.enum';
import {
  ReferentielIdEnum,
  referentielIdEnumSchema,
} from '../models/referentiel-id.enum';

export const listActionsRequestOptionsSchema = z.object({
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
  referentielIds: referentielIdEnumSchema
    .array()
    .optional()
    .describe(
      'Liste des identifiants des référentiels à récupérer (ex : [cae, eci]).'
    ),
});

export const listActionsRequestSchema = z.object({
  collectiviteId: z.number(),
  filters: listActionsRequestOptionsSchema.default({
    actionTypes: [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION],
    referentielIds: [ReferentielIdEnum.CAE, ReferentielIdEnum.ECI],
  }),
});

export type ListActionsRequestType = z.infer<typeof listActionsRequestSchema>;
export type ListActionsRequestOptionsType = z.infer<
  typeof listActionsRequestOptionsSchema
>;
