import z from 'zod';

/**
 * Une entrée de la liste des contributeurs (utilisateurs) ayant modifié
 * l'historique d'une collectivité, telle que renvoyée par
 * `referentiels.historique.listUtilisateurs`.
 */
export const historiqueUtilisateurSchema = z.object({
  modifiedById: z.string().uuid(),
  modifiedByNom: z.string().nullable(),
});
export type HistoriqueUtilisateur = z.infer<typeof historiqueUtilisateurSchema>;

export const listHistoriqueUtilisateurOutputSchema =
  historiqueUtilisateurSchema.array();
