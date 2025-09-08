import { personneTagOrUserSchema } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { tagSchema } from '@/backend/collectivites/tags/tag.table-base';
import { authorSchema } from '@/backend/users/models/author.utils';
import z from 'zod';
import { indicateurCollectiviteSchema } from '../indicateur-collectivite.table';
import { indicateurDefinitionSchema } from '../indicateur-definition.table';

export const indicateurDefinitionEnfantDtoSchema =
  indicateurDefinitionSchema.pick({
    id: true,
    identifiantReferentiel: true,
    titre: true,
    titreCourt: true,
  });

export const indicateurDefinitionParentDtoSchema =
  indicateurDefinitionEnfantDtoSchema.extend({
    parent: indicateurDefinitionEnfantDtoSchema.nullable(),
  });

export const definitionListItemSchema = indicateurDefinitionSchema.extend({
  commentaire: z.string().nullable(),
  estConfidentiel: z.boolean().nullable(),
  estFavori: z.boolean().nullable(),
  categories: z.array(tagSchema),
  thematiques: z.array(tagSchema),
  pilotes: z.array(personneTagOrUserSchema),
  services: z.array(tagSchema),
  enfants: z.array(indicateurDefinitionEnfantDtoSchema),
  parent: indicateurDefinitionParentDtoSchema.nullable(),
  fiches: z
    .object({
      id: z.number(),
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
  estRempli: z.boolean(),
  modifiedBy: authorSchema.nullable(),
  modifiedAt: indicateurCollectiviteSchema.shape.modifiedAt,
});

export type DefinitionListItem = z.infer<typeof definitionListItemSchema>;

export const listDefinitionsOutputSchema = z.object({
  count: z.number().int(),
  pageCount: z.number().int(),
  pageSize: z.number().int(),
  page: z.number().int(),
  data: z.array(definitionListItemSchema),
});

export type ListDefinitionsOutput = z.infer<typeof listDefinitionsOutputSchema>;
