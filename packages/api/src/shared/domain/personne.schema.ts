import { z } from 'zod';

/**
 * Schéma zod d'une personne avec id du tag ou de l'utilisateur
 */
export const personneSchema = z.object({
  nom: z.string().nullish(),
  collectiviteId: z.number().nullable(),
  tagId: z.number().nullable(),
  userId: z.string().nullable(),
  // TODO remove this field ?
  idTablePassage: z.number().nullable().optional(),
});

/**
 * Type TS d'une personne avec id du tag ou de l'utilisateur
 */
export type Personne = z.input<typeof personneSchema>;
