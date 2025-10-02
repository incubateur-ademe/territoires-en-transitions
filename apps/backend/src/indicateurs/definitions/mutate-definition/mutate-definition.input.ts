import { serviceTagSchema } from '@/backend/collectivites/tags/service-tag.table';
import { thematiqueSchema } from '@/backend/shared/thematiques/thematique.table';
import { createInsertSchema } from 'drizzle-zod';
import z from 'zod';
import { upsertIndicateurDefinitionPilotesInputSchema } from '../handle-definition-pilotes/handle-definition-pilotes.input';
import { indicateurDefinitionTable } from '../indicateur-definition.table';

export const createIndicateurDefinitionInputSchema = createInsertSchema(
  indicateurDefinitionTable
)
  .pick({
    titre: true,
    unite: true,
  })
  // Pour les indicateurs personnalisés, l'unité n'est pas obligatoire ('' string vide en base le cas échéant)
  .partial({ unite: true })
  .extend({
    collectiviteId: z.number(),
    thematiques: z
      .array(thematiqueSchema.pick({ id: true }))
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
  indicateurFields: createIndicateurDefinitionInputSchema
    .omit({
      collectiviteId: true,
      ficheId: true,
      thematiques: true,
    })
    .extend({
      ficheIds: z.array(z.number()).optional(),
      pilotes: z.array(upsertIndicateurDefinitionPilotesInputSchema).optional(),
      services: z.array(serviceTagSchema.pick({ id: true })).optional(),
      thematiques: z.array(thematiqueSchema.pick({ id: true })).optional(),
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
