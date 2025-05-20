import { z } from 'zod';

export const filtreRessourceLieesSchema = z.object({
  planActionIds: z.coerce.number().array().optional(),
  referentielActionIds: z.string().array().optional(),
  ficheActionIds: z.number().array().optional(),
  linkedFicheIds: z.number().array().optional(),

  utilisateurPiloteIds: z.string().array().optional(),
  personnePiloteIds: z.coerce.number().array().optional(),
  utilisateurReferentIds: z.string().array().optional(),
  personneReferenteIds: z.coerce.number().array().optional(),
  structurePiloteIds: z.coerce.number().array().optional(),
  servicePiloteIds: z.coerce.number().array().optional(),

  thematiqueIds: z.coerce.number().array().optional(),
  financeurIds: z.coerce.number().array().optional(),
  partenaireIds: z.coerce.number().array().optional(),
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

  utilisateurReferents: z
    .object({
      userId: z.string(),
      nom: z.string(),
      prenom: z.string(),
    })
    .array()
    .optional(),

  personneReferentes: z
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

  financeurs: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),

  partenaires: z
    .object({
      id: z.number(),
      nom: z.string(),
    })
    .array()
    .optional(),
});

export type FiltreValues = z.infer<typeof filtreValuesSchema>;
