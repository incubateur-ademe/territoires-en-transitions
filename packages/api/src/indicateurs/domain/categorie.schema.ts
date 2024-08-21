import {z} from 'zod';

// À voir comment on gère les autres catégories plus tard
export const categorieProgrammeEnumSchema = z.enum([
  'clef',
  'cae',
  'eci',
  'crte',
]);

export type CategorieProgramme = z.infer<typeof categorieProgrammeEnumSchema>;

/**
 * Schéma zod d'une catégorie d'indicateur (type et programmes)
 */
export const categorieSchema = z.object({
  id: z.number().optional(),
  collectiviteId: z.number(),
  nom: categorieProgrammeEnumSchema,
});

export type Categorie = z.input<typeof categorieSchema>;
