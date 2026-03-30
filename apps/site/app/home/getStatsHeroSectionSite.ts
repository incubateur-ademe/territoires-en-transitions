import 'server-only';

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

export async function getStatsHeroSectionSite(): Promise<StatsHeroSectionSite | null> {
  const connectionString = process.env.DB_STATS_URL?.trim();
  if (!connectionString) {
    return null;
  }

  try {
    return await fetchStatsHeroSectionSiteUncached(connectionString);
  } catch (error) {
    console.error('[getStatsHeroSectionSite]', error);
    return null;
  }
}
