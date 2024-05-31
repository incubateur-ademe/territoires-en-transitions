import {z} from 'zod';

/**
 * Schéma zod d'une thématique
 */
export const thematiqueSchema = z.object({
    id : z.number(),
    nom : z.string()
});

/**
 * Type TS d'une thématique
 */
export type Thematique = z.input<typeof thematiqueSchema>;


/**
 * Schéma zod d'une sous thématique avec l'objet de la thématique
 */
export const sousThematiqueSchema = z.object({
    id : z.number(),
    nom : z.string(),
    thematique : thematiqueSchema
});

/**
 * Type TS d'une sous thématique avec l'objet de la thématique
 */
export type SousThematique = z.input<typeof sousThematiqueSchema>;

/**
 * Schéma zod d'une sous thématique avec l'id de la thématique
 */
export const sousThematiqueSchemaId = z.object({
    id : z.number(),
    nom : z.string(),
    thematique : z.number()
});

/**
 * Type TS d'une sous thématique avec l'id de la thématique
 */
export type SousThematiqueId = z.input<typeof sousThematiqueSchemaId>;

