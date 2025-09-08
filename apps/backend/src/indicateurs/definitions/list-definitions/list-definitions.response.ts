import { personneTagOrUserSchema } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { tagSchema } from '@/backend/collectivites/tags/tag.table-base';
import { indicateurDefinitionEnfantDtoSchema } from '@/backend/indicateurs/definitions/list-definitions/definition-enfant.dto';
import { authorSchema } from '@/backend/users/models/author.utils';
import z from 'zod';
import { indicateurCollectiviteSchema } from '../indicateur-collectivite.table';
import { indicateurDefinitionSchema } from '../indicateur-definition.table';

export const indicateurDefinitionDetailleeSchema =
  indicateurDefinitionSchema.extend({
    commentaire: z.string().nullable(),
    estConfidentiel: z.boolean().nullable(),
    estFavori: z.boolean().nullable(),
    categories: z.array(tagSchema),
    thematiques: z.array(tagSchema),
    pilotes: z.array(personneTagOrUserSchema),

    services: z.array(tagSchema),
    enfants: indicateurDefinitionEnfantDtoSchema.array().nullable(),
    parents: indicateurDefinitionEnfantDtoSchema.array().nullable(),
    fiches: z
      .object({
        id: z.string(),
        titre: z.string(),
      })
      .array(),
    mesures: z
      .object({
        id: z.string(),
        nom: z.string(),
      })
      .array(),
    groupementCollectivites: z
      .object({
        id: z.number(),
        nom: z.string(),
      })
      .array(),
    hasOpenData: z.boolean(),
    estPerso: z.boolean(),
    estAgregation: z.boolean(),
    modifiedBy: authorSchema.nullable(),
    modifiedAt: indicateurCollectiviteSchema.shape.modifiedAt,
  });

export type IndicateurDefinitionDetaillee = z.infer<
  typeof indicateurDefinitionDetailleeSchema
>;

export const listDefinitionsOutputSchema = z.object({
  count: z.number().int(),
  pageCount: z.number().int(),
  pageSize: z.number().int(),
  page: z.number().int(),
  data: indicateurDefinitionDetailleeSchema.array(),
});

export type ListDefinitionsOutput = z.infer<typeof listDefinitionsOutputSchema>;
