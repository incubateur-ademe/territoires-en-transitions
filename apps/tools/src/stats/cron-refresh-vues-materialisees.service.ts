import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../utils/database/database.service';

/**
 * Rafraîchit les vues matérialisées encore lues par la plateforme, à la place
 * des jobs pg_cron historiques `site_labellisation` (jobid 23) et
 * `refresh_stats_views_crm` (jobid 29), aux mêmes horaires.
 */
@Injectable()
export class CronRefreshVuesMaterialiseesService {
  constructor(private readonly databaseService: DatabaseService) {}

  /** Lue par le backend pour les pages collectivités du site public. */
  async refreshSiteLabellisation() {
    await this.databaseService.db.execute(
      sql`refresh materialized view site_labellisation`
    );
  }

  /**
   * `stats.crm_indicateurs` et `stats.crm_plans`, lues par la synchro Airtable
   * (`crm-indicateurs-sync`, `crm-plans-sync`). Le refresh est long : le job
   * pg_cron levait déjà le statement_timeout à 1 h.
   */
  async refreshStatsCrm() {
    await this.databaseService.db.transaction(async (tx) => {
      await tx.execute(sql`set local statement_timeout = '1h'`);
      await tx.execute(sql`select stats.refresh_views_crm()`);
    });
  }
}
