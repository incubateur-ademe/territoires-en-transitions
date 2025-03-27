import { z } from 'zod';

export const filtersRequestSchema = z.object({
  typesPlan : z.number().array(),
  nom : z.string().optional(),
  regions : z.string().array(),
  departments : z.string().array(),
  typesCollectivite: z.string().array(),
  population : z.string().array(),
  referentiel : z.string().array(),
  niveauDeLabellisation : z.string().array(),
  realiseCourant : z.string().array(),
  tauxDeRemplissage : z.string().array(),
  trierPar : z.string().array().optional(),
  page : z.number().optional(),
  nbCards : z.number()
});
export type FiltersRequest = z.infer<typeof filtersRequestSchema>;

