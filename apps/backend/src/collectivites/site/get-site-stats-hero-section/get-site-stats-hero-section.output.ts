import { z } from 'zod';

/** Chiffres clés affichés sur le site, calculés à J-1 par l'équipe data. */
export const siteStatsHeroSectionSchema = z.object({
  nbCollectivitesActives12Mois: z.number().nullable(),
  nbUtilisateursActifs12Mois: z.number().nullable(),
  nbPlansActifs12Mois: z.number().nullable(),
  nbActionsPilotablesActives12Mois: z.number().nullable(),
});
export type SiteStatsHeroSection = z.infer<typeof siteStatsHeroSectionSchema>;
