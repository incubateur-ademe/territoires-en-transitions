import {z} from 'zod';
import {valeurSchema} from "./valeur.schema";

/**
 * Schéma zod des métadonnées d'une source pour une valeur d'indicateur
 */
export const sourceMetadonneeSchema = z.object({
    id : z.number(),
    source : z.string(),
    dateVersion : z.string().datetime(),
    nomDonnee : z.string().nullable(),
    diffuseur : z.string().nullable(),
    producteur : z.string().nullable(),
    methodologie : z.string().nullable(),
    limites : z.string().nullable()
});
/**
 * Type TS des métadonnées d'une source pour une valeur d'indicateur
 */
export type SourceMetadonnee = z.input<typeof sourceMetadonneeSchema>;

/**
 * Schéma zod d'une source de donnée
 */
export const sourceSchema = z.object ({
    id : z.string(),
    libelle : z.string(),
    ordreAffichage : z.number().optional().nullable()
});
/**
 * Type TS d'une source de donnée
 */
export type Source = z.input<typeof sourceSchema>;

