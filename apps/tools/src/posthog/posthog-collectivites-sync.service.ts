import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { chunk } from 'es-toolkit';
import { DatabaseService } from '../utils/database/database.service';
import { sleep } from '../utils/sleep.utils';
import { GroupProperties, PostHogClientService } from './posthog-client.service';

/**
 * Group type PostHog (index 0) — aligné sur
 * `apps/backend/src/utils/tracking/posthog-event-tracker.ts` (`groups: { collectivite }`).
 */
const GROUP_TYPE = 'collectivite';

/** Nombre de `$groupidentify` par requête HTTP `/batch` (cf. `maxBatchSize`). */
const CHUNK_SIZE = 1000;

/** Petite pause entre deux lots — politesse / backpressure, pas un rate limit. */
const SLEEP_BETWEEN_CHUNKS_MS = 200;

/**
 * Synchronise quotidiennement le group type PostHog "collectivite" à partir de
 * la table `collectivite` : pour chaque collectivité, un évènement
 * `$groupidentify` avec un jeu de propriétés uniforme calqué sur les colonnes
 * de la table (hors `preferences`). `$set` merge côté PostHog : les anciennes
 * propriétés dérivées (fiches, completude_*, pa_*, …) probablement issues d'un
 * import précédent à présent désactivé (pg_cron ou déclenchement manuel),
 * ne sont pas touchées.
 */
@Injectable()
export class PostHogCollectivitesSyncService {
  private readonly logger = new Logger(PostHogCollectivitesSyncService.name);

  constructor(
    private readonly posthogClient: PostHogClientService,
    private readonly databaseService: DatabaseService
  ) {}

  async process(): Promise<{ synced: number; skipped: boolean }> {
    if (!this.posthogClient.isEnabled()) {
      this.logger.warn(
        'Client PostHog non configuré : synchro du groupe collectivite ignorée'
      );
      return { synced: 0, skipped: true };
    }

    const startedAt = Date.now();
    const rows = await this.fetchCollectivites();
    this.logger.log(`${rows.length} collectivité(s) à synchroniser`);

    if (rows.length === 0) {
      // Une base qui ne renvoie aucune collectivité est un signal de panne en
      // amont, pas un cas nominal. On lève pour que le consumer BullMQ relance
      // le job (retry + capture Sentry à la dernière tentative) au lieu de le
      // terminer en succès silencieux.
      this.logger.warn(
        'Aucune collectivité lue : synchro PostHog interrompue sans envoi'
      );
      throw new Error(
        'Synchro PostHog collectivite : aucune collectivité lue depuis la table `collectivite`'
      );
    }

    const chunks = chunk(rows, CHUNK_SIZE);
    for (const [index, rowsChunk] of chunks.entries()) {
      for (const row of rowsChunk) {
        this.posthogClient.groupIdentify(
          GROUP_TYPE,
          row.collectivite_id,
          row as GroupProperties
        );
      }
      await this.posthogClient.flush();
      if (index < chunks.length - 1) {
        await sleep(SLEEP_BETWEEN_CHUNKS_MS);
      }
    }
    await this.posthogClient.flush();

    const elapsedMs = Date.now() - startedAt;
    this.logger.log(
      `${rows.length} collectivité(s) synchronisée(s) en ${elapsedMs}ms (${chunks.length} lot(s))`
    );
    return { synced: rows.length, skipped: false };
  }

  /**
   * Lit toutes les colonnes de `collectivite` sauf `preferences`, mappées sur
   * les noms de colonnes DB (snake_case). Matérialisé en mémoire : pas de
   * transaction ouverte pendant l'envoi à PostHog.
   */
  private async fetchCollectivites() {
    return this.databaseService.db
      .select({
        collectivite_id: collectiviteTable.id,
        created_at: collectiviteTable.createdAt,
        modified_at: collectiviteTable.modifiedAt,
        access_restreint: collectiviteTable.accesRestreint,
        nom: collectiviteTable.nom,
        type: collectiviteTable.type,
        commune_code: collectiviteTable.communeCode,
        siren: collectiviteTable.siren,
        nic: collectiviteTable.nic,
        departement_code: collectiviteTable.departementCode,
        region_code: collectiviteTable.regionCode,
        nature_insee: collectiviteTable.natureInsee,
        population: collectiviteTable.population,
        dans_aire_urbaine: collectiviteTable.dansAireUrbaine,
      })
      .from(collectiviteTable);
  }
}
