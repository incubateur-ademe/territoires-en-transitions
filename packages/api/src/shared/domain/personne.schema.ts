import {z} from 'zod';

/**
 * Schéma zod d'une personne avec id du tag ou de l'utilisateur
 */
export const personneSchema = z.object({
    nom : z.string().nullable().optional(),
    collectiviteId : z.number(),
    tagId : z.number().nullable().optional(),
    userId : z.string().nullable().optional(),
    idTablePassage : z.number().nullable().optional()
});

/**
 * Type TS d'une personne avec id du tag ou de l'utilisateur
 */
export type Personne = z.input<typeof personneSchema>;