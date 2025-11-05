import { serviceTagSchema } from '@/domain/collectivites';
import { indicateurDefinitionSchemaCreate } from '@/domain/indicateurs';
import { thematiqueSchema } from '@/domain/shared';
import z from 'zod';
import * as zm from 'zod/mini';
import { upsertIndicateurDefinitionPilotesInputSchema } from '../handle-definition-pilotes/handle-definition-pilotes.input';

export const createIndicateurDefinitionInputSchema = z.object({
  titre: indicateurDefinitionSchemaCreate.shape.titre,
  unite: z.optional(indicateurDefinitionSchemaCreate.shape.unite),
  collectiviteId: z.number(),
  thematiques: z
    .array(z.object({ id: thematiqueSchema.shape.id }))
    .optional()
    .default([]),
  commentaire: z
    .string()
    .optional()
    .describe('Correspond au champ "description et méthodologie de calcul"'),
  estFavori: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Si l'indicateur doit faire parti des indicateurs favoris de la collectivité"
    ),
  estConfidentiel: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Si true, la valeur associée à l'indicateur la plus récente n'est pas consultable en mode visite."
    ),
  ficheId: z
    .number()
    .int()
    .optional()
    .describe('Fiche à laquelle rattacher le nouvel indicateur'),
});

export type CreateIndicateurDefinitionInput = z.output<
  typeof createIndicateurDefinitionInputSchema
>;

export const updateIndicateurDefinitionInputSchema = z.object({
  indicateurId: z.number(),
  collectiviteId: z.number(),
  indicateurFields: z
    .object({
      ...createIndicateurDefinitionInputSchema.omit({
        collectiviteId: true,
        ficheId: true,
        thematiques: true,
      }).shape,

      ficheIds: z.array(z.number()).optional(),
      pilotes: z.array(upsertIndicateurDefinitionPilotesInputSchema).optional(),
      services: z.array(zm.pick(serviceTagSchema, { id: true })).optional(),
      thematiques: z
        .array(z.object({ id: thematiqueSchema.shape.id }))
        .optional(),
    })
    .partial(),
});

export type UpdateIndicateurDefinitionInput = z.infer<
  typeof updateIndicateurDefinitionInputSchema
>;

export const deleteIndicateurDefinitionInputSchema = z.object({
  indicateurId: z.number().int().positive(),
  collectiviteId: z.number().int().positive(),
});

export type DeleteIndicateurDefinitionInput = z.infer<
  typeof deleteIndicateurDefinitionInputSchema
>;
