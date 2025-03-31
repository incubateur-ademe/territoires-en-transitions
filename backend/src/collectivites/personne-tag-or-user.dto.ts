import { z } from 'zod';

/**
 * Schéma zod d'une personne avec id du tag ou de l'utilisateur
 */
export const personneTagOrUserSchema = z.object({
  nom: z.string().nullish(),
  collectiviteId: z.number().nullable(),
  tagId: z.number().nullish(),
  userId: z.string().nullish(),
});

/**
 * Type TS d'une personne avec id du tag ou de l'utilisateur
 */
export type PersonneTagOrUser = z.infer<typeof personneTagOrUserSchema>;
