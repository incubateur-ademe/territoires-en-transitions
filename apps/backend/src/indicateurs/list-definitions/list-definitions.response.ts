import { indicateurDefinitionEnfantDtoSchema } from '@/backend/indicateurs/list-definitions/definition-enfant.dto';
import z from 'zod';
import { indicateurDefinitionSchema } from '../shared/models/indicateur-definition.table';

export const indicateurDefinitionDetailleeSchema =
  indicateurDefinitionSchema.extend({
    commentaire: z.string().nullable(),
    confidentiel: z.boolean().nullable(),
    favoris: z.boolean().nullable(),
    categories: z
      .object({
        id: z.number().int(),
        nom: z.string(),
      })
      .array(),
    thematiques: z
      .object({
        id: z.number().int(),
        nom: z.string(),
      })
      .array(),
    enfants: indicateurDefinitionEnfantDtoSchema.array().nullable(),
    parents: indicateurDefinitionEnfantDtoSchema.array().nullable(),
    mesures: z
      .object({
        id: z.string(),
        nom: z.string(),
      })
      .array(),
    hasOpenData: z.boolean(),
    estPerso: z.boolean(),
    estAgregation: z.boolean(),
    modifiedBy: z.object({
      id: z.string().uuid(),
      prenom: z.string(),
      nom: z.string(),
    }).nullable(),
  });

export type IndicateurDefinitionDetaillee = z.infer<
  typeof indicateurDefinitionDetailleeSchema
>;

export const listDefinitionsResponseSchema = z.object({
  count: z.number().int(),
  pageCount: z.number().int(),
  pageSize: z.number().int(),
  page: z.number().int(),
  data: indicateurDefinitionDetailleeSchema.array(),
});

export type ListDefinitionsResponse = z.infer<
  typeof listDefinitionsResponseSchema
>;
