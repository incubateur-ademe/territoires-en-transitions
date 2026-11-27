import { Injectable } from '@nestjs/common';
import { AnalyticsDatabaseService } from '@tet/backend/utils/database/analytics-database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { SiteStatsHeroSection } from './get-site-stats-hero-section.output';

// pg rend les bigint en chaînes.
const toNumber = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

/**
 * Le site passe par ici plutôt que de se connecter lui-même à la base
 * analytique : un seul consommateur, un seul identifiant côté prod.
 */
@Injectable()
export class GetSiteStatsHeroSectionService {
  constructor(private readonly analytics: AnalyticsDatabaseService) {}

  /** `null` sans base analytique (local, CI) ou sans ligne : le site masque les chiffres. */
  async get(): Promise<Result<SiteStatsHeroSection | null, CommonError>> {
    if (!this.analytics.isConfigured()) {
      return success(null);
    }

    const result = await this.analytics.query({
      text: `select
        nb_ct_actif_12_mois,
        nb_user_actif_12_mois,
        nb_pap_actif_12_mois,
        nb_action_pilotable_active_12_mois
      from public.stats_hero_section_site`,
      maxRows: 1,
    });
    if (!result.success) {
      return failure('DATABASE_ERROR', result.cause);
    }

    const row = result.data.rows[0];
    return success(
      row
        ? {
            nbCollectivitesActives12Mois: toNumber(row.nb_ct_actif_12_mois),
            nbUtilisateursActifs12Mois: toNumber(row.nb_user_actif_12_mois),
            nbPlansActifs12Mois: toNumber(row.nb_pap_actif_12_mois),
            nbActionsPilotablesActives12Mois: toNumber(
              row.nb_action_pilotable_active_12_mois
            ),
          }
        : null
    );
  }
}
