import {z} from 'zod';
import {sourceMetadonneeSchema} from "./source.schema";

/**
 * Schéma zod d'une valeur d'indicateur
 */
export const valeurSchema = z.object({
    id : z.number().optional().nullable(),
    collectiviteId : z.number(),
    indicateurId : z.number(),
    source : sourceMetadonneeSchema.optional().nullable(),
    resultat : z.number().optional().nullable(),
    objectif : z.number().optional().nullable(),
    estimation : z.number().optional().nullable(),
    resultatCommentaire : z.string().optional().nullable(),
    objectifCommentaire : z.string().optional().nullable(),
    annee : z.number()
});

/**
 * Type TS d'une valeur d'indicateur
 */
export type Valeur = z.input<typeof valeurSchema>;


/**
 * Schéma zod d'une ligne de comparaison entre les valeurs utilisateurs et source
 */
export const valeurComparaisonLigneSchema = z.object({
    conflit: z.boolean(),
    annee : z.number(),
    idAEcraser : z.number().nullable(),
    idAAppliquer : z.number(),
    valeurAEcraser: z.number().nullable(),
    valeurAAppliquer: z.number(),
    source : z.string()
});

/**
 * Type TS d'une ligne de comparaison entre les valeurs utilisateurs et source
 */
export type ValeurComparaisonLigne = z.input<typeof valeurComparaisonLigneSchema>;

/**
 * Schéma zod pour la comparaison des valeurs utilisateurs avec les valeurs d'une source
 */
export const valeurComparaisonSchema = z.object({
    lignes : valeurComparaisonLigneSchema.array(),
    conflits : z.number(),
    ajouts : z.number()
});

/**
 * Type TS pour la comparaison des valeurs utilisateurs avec les valeurs d'une source
 */
export type ValeurComparaison = z.input<typeof valeurComparaisonSchema>;