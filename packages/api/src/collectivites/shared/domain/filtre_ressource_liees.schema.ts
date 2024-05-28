import {z} from 'zod';

export const filtreRessourceLieesSchema = z.object({
  planActionIds: z.number().array().optional(),

  utilisateurPiloteIds: z.string().array().optional(),
  personnePiloteIds: z.number().array().optional(),
  structurePiloteIds: z.number().array().optional(),
  servicePiloteIds: z.number().array().optional(),

  thematiqueIds: z.number().array().optional(),
});

export type FiltreRessourceLiees = z.infer<typeof filtreRessourceLieesSchema>;

/**
 * Schema de retour des valeurs associées aux ids des filtres.
 */
export const filtreValuesSchema = z.object({
  planActions: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  utilisateurPilotes: z
    .object({
      userId: z.string(),
      nom: z.string(),
      prenom: z.string(),
    })
    .array()
    .optional(),

  personnePilotes: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  structurePilotes: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  servicePilotes: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  thematiques: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),
});

export type FiltreValues = z.infer<typeof filtreValuesSchema>;
