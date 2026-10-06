import z from 'zod';

/**
 * Ligne de l'onglet `Tags` du spreadsheet d'un référentiel
 */
export const importReferentielTagSchema = z.object({
  /* Identifiant référencé dans la colonne `tags` de l'onglet de structure */
  id: z.string(),
  nom: z.string(),
  type: z.string(),
});

export type ImportReferentielTag = z.infer<typeof importReferentielTagSchema>;
