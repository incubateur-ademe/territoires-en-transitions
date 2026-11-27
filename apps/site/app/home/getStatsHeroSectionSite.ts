import 'server-only';

import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import { unstable_cache } from 'next/cache';

export type StatsHeroSectionSite = {
  nb_ct_actif_12_mois: number | null;
  nb_user_actif_12_mois: number | null;
  nb_pap_actif_12_mois: number | null;
  nb_action_pilotable_active_12_mois: number | null;
};

// Le site ne se connecte pas à la base de statistiques : le backend en est le
// seul lecteur. Agrégats sur 12 mois, une lecture par heure suffit.
const fetchStatsHeroSectionSiteCached = unstable_cache(
  async (): Promise<StatsHeroSectionSite | null> => {
    const stats =
      await getSiteTrpcClient().collectivites.site.getStatsHeroSection.query();
    return (
      stats && {
        nb_ct_actif_12_mois: stats.nbCollectivitesActives12Mois,
        nb_user_actif_12_mois: stats.nbUtilisateursActifs12Mois,
        nb_pap_actif_12_mois: stats.nbPlansActifs12Mois,
        nb_action_pilotable_active_12_mois:
          stats.nbActionsPilotablesActives12Mois,
      }
    );
  },
  ['stats-hero-section-site'],
  { revalidate: 3600 }
);

export async function getStatsHeroSectionSite(): Promise<StatsHeroSectionSite | null> {
  try {
    return await fetchStatsHeroSectionSiteCached();
  } catch (error) {
    // Une erreur n'est pas mise en cache : la visite suivante réessaie.
    console.error('[getStatsHeroSectionSite]', error);
    return null;
  }
}
