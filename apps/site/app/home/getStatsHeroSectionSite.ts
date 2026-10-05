import 'server-only';

import { unstable_cache } from 'next/cache';
import { Client } from 'pg';

export type StatsHeroSectionSite = {
  nb_ct_actif_12_mois: number | null;
  nb_user_actif_12_mois: number | null;
  nb_pap_actif_12_mois: number | null;
  nb_action_pilotable_active_12_mois: number | null;
};

async function fetchStatsHeroSectionSiteUncached(
  connectionString: string
): Promise<StatsHeroSectionSite | null> {
  const client = new Client({ connectionString, ssl: true });
  try {
    await client.connect();
    const { rows } = await client.query<StatsHeroSectionSite>(
      `select
        nb_ct_actif_12_mois,
        nb_user_actif_12_mois,
        nb_pap_actif_12_mois,
        nb_action_pilotable_active_12_mois
      from stats_hero_section_site
      limit 1`
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    return row;
  } finally {
    await client.end();
  }
}

// Agrégats sur 12 mois : une lecture par heure suffit, au lieu d'une connexion
// à la base par visite (accueil et plateforme numérique). L'URL de connexion
// est lue dans la fonction pour ne pas entrer dans la clé de cache.
const fetchStatsHeroSectionSiteCached = unstable_cache(
  async () =>
    fetchStatsHeroSectionSiteUncached(process.env.DB_STATS_URL?.trim() ?? ''),
  ['stats-hero-section-site'],
  { revalidate: 3600 }
);

export async function getStatsHeroSectionSite(): Promise<StatsHeroSectionSite | null> {
  // Sans base de statistiques (dev local), rien à lire ni à mettre en cache.
  if (!process.env.DB_STATS_URL?.trim()) return null;

  try {
    return await fetchStatsHeroSectionSiteCached();
  } catch (error) {
    // Une erreur n'est pas mise en cache : la visite suivante réessaie.
    console.error('[getStatsHeroSectionSite]', error);
    return null;
  }
}
