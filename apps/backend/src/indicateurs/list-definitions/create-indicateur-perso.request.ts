import { z } from 'zod';

export const createIndicateurPersoRequestSchema = z
  .object({
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
    titre: z.string().optional().describe('Titre'),
    unite: z
      .string()
      .optional()
      .describe('Unité dans laquelle sont exprimées les valeurs'),
    thematiques: z
      .number()
      .int()
      .array()
      .optional()
      .default([])
      .describe('ID des thématiques associées'),
    commentaire: z.string().optional().describe('Description et méthodologie de calcul'),
    favoris: z
      .boolean()
      .optional()
      .default(false)
      .describe('Fait partie des indicateurs favoris de la collectivité'),
    ficheId: z
      .number()
      .int()
      .optional()
      .describe('Fiche action à laquelle rattacher le nouvel indicateur'),
  })
  .describe('Ajoute un indicateur personnalisé');

export type CreateIndicateurPersoRequest = z.infer<
  typeof createIndicateurPersoRequestSchema
>;
