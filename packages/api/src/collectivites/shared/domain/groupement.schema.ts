import {z} from 'zod';

/**
 * Schéma zod des métadonnées d'une source pour une valeur d'indicateur
 */
export const groupementSchema = z.object({
    id : z.number(),
    nom : z.string(),
    collectivites : z.number().array().optional()
});
/**
 * Type TS des métadonnées d'une source pour une valeur d'indicateur
 */
export type Groupement = z.input<typeof groupementSchema>;