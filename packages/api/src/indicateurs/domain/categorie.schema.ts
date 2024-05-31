import {z} from 'zod';
import {tagSchema} from "../../shared/domain/tag.schema";

/**
 * Schéma zod d'une catégorie d'indicateur (type et programmes)
 */
export const categorieSchema =
    tagSchema.omit({collectiviteId: true});

/**
 * Type TS d'une catégorie d'indicateur (type et programmes)
 */
export type Categorie = z.input<typeof categorieSchema>;
