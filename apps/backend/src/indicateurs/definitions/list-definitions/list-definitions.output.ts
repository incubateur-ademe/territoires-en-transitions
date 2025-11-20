import { authorSchema } from '@tet/backend/users/models/author.utils';
import { personneTagOrUserSchema, tagSchema } from '@tet/domain/collectivites';
import {
  indicateurCollectiviteSchema,
  indicateurDefinitionSchema,
} from '@tet/domain/indicateurs';
import z from 'zod';

export const indicateurDefinitionEnfantDtoSchema = z.object({
  id: indicateurDefinitionSchema.shape.id,
  identifiantReferentiel:
    indicateurDefinitionSchema.shape.identifiantReferentiel,
  titre: indicateurDefinitionSchema.shape.titre,
  titreCourt: indicateurDefinitionSchema.shape.titreCourt,
});

export const indicateurDefinitionParentDtoSchema = z.object({
  ...indicateurDefinitionEnfantDtoSchema.shape,
  parent: z.nullable(indicateurDefinitionEnfantDtoSchema),
});

export const definitionListItemSchema = z.object({
  ...indicateurDefinitionSchema.shape,
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
  modifiedBy: z.nullable(authorSchema),
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
