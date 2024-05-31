import {z} from 'zod';

export type TypeTag  =
    'personne' |
    'service' |
    'partenaire' |
    'categorie' |
    'financeur' |
    'structure';

/**
 * Schéma zod d'un tag
 */
export const tagSchema = z.object({
    id : z.number().optional(),
    collectiviteId : z.number(),
    nom : z.string()
});

/**
 * Type TS d'un tag
 */
export type Tag = z.input<typeof tagSchema>;