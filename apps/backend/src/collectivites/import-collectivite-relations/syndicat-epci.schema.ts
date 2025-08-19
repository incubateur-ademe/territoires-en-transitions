import z from 'zod';

// Schema for the CSV data from perimetres_epci_syndicats
export const syndicatEpciSchema = z.object({
  dept: z.string(),
  siren: z.string(),
  raison_sociale: z.string(),
  nature_juridique: z.string(),
  mode_financ: z.string(),
  arret_competences: z.string(),
  siren_membre: z.string(),
  nom_membre: z.string(),
  type_membre: z.enum(['Groupement', 'Commune', 'Autres']),
});

export type SyndicatEpci = z.infer<typeof syndicatEpciSchema>;
