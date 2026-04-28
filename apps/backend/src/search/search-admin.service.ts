import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  DOCUMENT_INDEX,
  DOCUMENT_INDEX_SETTINGS,
} from '@tet/backend/collectivites/documents/document-indexer/document-index.constants';
import { DocumentIndexerService } from '@tet/backend/collectivites/documents/document-indexer/document-indexer.service';
import {
  INDICATEUR_INDEX,
  INDICATEUR_INDEX_SETTINGS,
} from '@tet/backend/indicateurs/indicateurs/indicateur-indexer/indicateur-index.constants';
import { IndicateurIndexerService } from '@tet/backend/indicateurs/indicateurs/indicateur-indexer/indicateur-indexer.service';
import {
  FICHE_INDEX,
  FICHE_INDEX_SETTINGS,
} from '@tet/backend/plans/fiches/fiche-indexer/fiche-index.constants';
import { FicheIndexerService } from '@tet/backend/plans/fiches/fiche-indexer/fiche-indexer.service';
import {
  PLAN_INDEX,
  PLAN_INDEX_SETTINGS,
} from '@tet/backend/plans/plans/plan-indexer/plan-index.constants';
import { PlanIndexerService } from '@tet/backend/plans/plans/plan-indexer/plan-indexer.service';
import {
  ACTION_INDEX,
  ACTION_INDEX_SETTINGS,
} from '@tet/backend/referentiels/action-indexer/action-index.constants';
import { ActionIndexerService } from '@tet/backend/referentiels/action-indexer/action-indexer.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { TRPCError } from '@trpc/server';
import { Redis } from 'ioredis';
import type { Settings } from 'meilisearch';

/**
 * Modes d'exécution exposés par les procédures admin de réindexation (U8).
 *
 * - `upsert` : appelle directement l'`indexAll()` de l'indexeur correspondant.
 *   Les documents existants sont ré-écrits à plat ; aucun document orphelin
 *   n'est supprimé. Sûr à exécuter sous trafic — c'est le mode recommandé pour
 *   se relever d'une perte de jobs Redis (cf. ADR 0006).
 *
 * - `rebuild` : écrit dans un index temporaire (`<name>_v2`), puis bascule
 *   atomiquement avec l'index live via `swapIndexes`, et supprime l'ancien.
 *   C'est le mode à utiliser pour purger les orphelins (entités absentes de la
 *   DB mais encore présentes dans l'index) et pour forcer une réindexation
 *   complète après un changement de réglages. À exécuter en heure creuse car
 *   les écritures live concurrentes sur l'index original sont perdues au swap.
 */
export type ReindexMode = 'upsert' | 'rebuild';

/**
 * Entités indexables — une procédure admin par valeur.
 */
export type ReindexEntity =
  | 'plans'
  | 'fiches'
  | 'indicateurs'
  | 'actions'
  | 'documents';

/**
 * Réponse renvoyée par chaque procédure admin de réindexation. Le compteur
 * reste indicatif (en `upsert` on ne le calcule pas — `indexAll()` ne renvoie
 * pas son total — d'où le `0` par défaut). En `rebuild` on n'en a pas non
 * plus de comptage exact côté Meilisearch sans waiter sur chaque tâche, ce
 * qui serait coûteux ; le compteur reste à 0 en v1. Le champ est conservé
 * pour stabilité d'API.
 */
export interface ReindexResult {
  indexedCount: number;
  durationMs: number;
  mode: ReindexMode;
}

/**
 * TTL par défaut du verrou Redis qui empêche les rebuilds concurrents pour
 * un même index. 30 minutes : large fenêtre couvrant un rebuild lourd
 * (`actions` × collectivités). Le verrou est libéré explicitement en
 * `try/finally` ; le TTL n'agit qu'en filet de sécurité si le process meurt
 * avant la fin (cf. plan U8).
 */
const REBUILD_LOCK_TTL_SECONDS = 30 * 60;

/**
 * Mapping (entité → index live + settings + indexeur correspondant).
 *
 * Centralisé ici plutôt que dans un `switch` à plusieurs endroits : la même
 * structure sert au gating, au rebuild et au build du nom d'index temporaire.
 */
type EntityConfig = {
  indexName: string;
  settings: Settings;
  /**
   * Réindexe l'entité vers `targetIndex` (l'index live par défaut, ou un
   * index temporaire pendant le rebuild). Retourne le nombre de documents
   * effectivement poussés vers Meilisearch — utilisé pour remplir
   * `ReindexResult.indexedCount`.
   */
  reindex: (targetIndex?: string) => Promise<number>;
};

/**
 * Service appelé depuis `SearchAdminRouter` (U8) pour exposer les chemins de
 * réindexation administrative. Cinq entités, deux modes par entité :
 *
 *   - `upsert` (sûr sous trafic) : on appelle directement l'`indexAll()` de
 *     l'indexeur — il écrit vers l'index live. Aucun document orphelin
 *     n'est purgé.
 *   - `rebuild` (atomique avec swap) : on prépare un index temporaire
 *     `<name>_v2`, on lui applique les `settings`, on remplit, on `swap`
 *     vers le nom canonique, on drop l'ancien `<name>_v2` (qui contient
 *     désormais les documents *originaux*).
 *
 * Concurrence du rebuild : un verrou Redis `search:rebuild:<indexName>` est
 * pris via `SET NX EX` ; un second rebuild concurrent reçoit `409 CONFLICT`.
 * Le verrou est relâché en `try/finally`. En cas de plantage process, le TTL
 * de 30 min libère le slot et l'opérateur doit nettoyer manuellement l'index
 * temporaire orphelin (acceptable v1, documenté dans le runbook).
 *
 * Permission : `COLLECTIVITES.MUTATE` sur `ResourceType.PLATEFORME` — même
 * paire d'enum que les endpoints admin de la plateforme
 * (`CollectiviteCrudRouter.upsert`).
 */
@Injectable()
export class SearchAdminService implements OnModuleDestroy {
  private readonly logger = new Logger(SearchAdminService.name);
  private readonly redis: Redis;

  constructor(
    private readonly planIndexer: PlanIndexerService,
    private readonly ficheIndexer: FicheIndexerService,
    private readonly indicateurIndexer: IndicateurIndexerService,
    private readonly actionIndexer: ActionIndexerService,
    private readonly documentIndexer: DocumentIndexerService,
    private readonly searchIndexer: SearchIndexerService,
    private readonly permissionService: PermissionService,
    private readonly config: ConfigurationService
  ) {
    // Connexion Redis dédiée aux verrous SETNX. On NE réutilise PAS la
    // connexion `Queue.client` de BullMQ : un consommateur de queue mis en
    // mode `subscriber` (futur) bloquerait les commandes RPC arbitraires sur
    // la même socket, et BullMQ peut renommer/clore ses connexions internes
    // sans préavis. Une connexion à part isole le cycle de vie du verrou.
    this.redis = new Redis({
      host: this.config.get('QUEUE_REDIS_HOST') as string,
      port: this.config.get('QUEUE_REDIS_PORT') as number,
      // Évite les retry-loops infinies pendant les tests locaux : si Redis
      // n'est pas joignable, on échoue vite et l'admin endpoint remonte une
      // 500 plutôt que de se figer. Mêmes hypothèses que `BullModule` au
      // bootstrap.
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    // Coupe la connexion Redis dédiée aux verrous lors du shutdown
    // (sinon Vitest signale des handles ouverts).
    try {
      this.redis.disconnect();
    } catch {
      // ignore
    }
  }

  /**
   * Point d'entrée principal des cinq procédures admin (`reindexPlans`,
   * `reindexFiches`, ...). Vérifie la permission plateforme avant tout, puis
   * délègue au flow `upsert` (idempotent) ou `rebuild` (atomique avec swap).
   */
  async reindex(
    user: AuthUser,
    entity: ReindexEntity,
    mode: ReindexMode
  ): Promise<ReindexResult> {
    // Gate plateforme — `isAllowed` lève `ForbiddenException` par défaut, ce
    // qui est traduit en `FORBIDDEN` côté tRPC par le `errorFormatter`
    // standard. On laisse l'exception remonter telle quelle pour rester
    // homogène avec `CollectiviteCrudRouter.upsert`.
    await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.MUTATE'],
      ResourceType.PLATEFORME,
      null
    );

    const cfg = this.entityConfig(entity);
    const start = Date.now();

    if (mode === 'upsert') {
      const indexedCount = await cfg.reindex();
      return {
        indexedCount,
        durationMs: Date.now() - start,
        mode,
      };
    }

    // mode === 'rebuild'
    const indexedCount = await this.rebuildEntity(cfg);
    return {
      indexedCount,
      durationMs: Date.now() - start,
      mode,
    };
  }

  // -------------------------------------------------------------------------
  // Rebuild flow
  // -------------------------------------------------------------------------

  /**
   * Pipeline de rebuild atomique pour une entité.
   *
   * 1. Prend un verrou Redis `search:rebuild:<indexName>` via `SET NX EX`.
   *    Si le verrou est tenu, lève `CONFLICT` (autre rebuild en cours).
   * 2. Applique les `settings` au temp index (Meilisearch ne les copie PAS
   *    automatiquement à la création — sans cette étape l'index swappé
   *    reviendrait à des défauts et les requêtes casseraient).
   * 3. Lance `indexAll(tempIndex)` pour remplir le temp index.
   * 4. Swap atomique entre l'index live et le temp index, puis attente du
   *    swap côté Meilisearch (sinon le `deleteIndex` qui suit pourrait
   *    courir contre une tâche encore en file).
   * 5. Supprime le `tempIndex` (qui contient désormais l'*ancien* index).
   * 6. Relâche le verrou (en `finally`, donc même en cas d'échec partiel).
   *
   * Risque connu (acceptable v1) : si le process meurt entre l'étape 2 et
   * l'étape 4, le temp index reste en place mais le verrou expire au TTL.
   * L'opérateur le purge manuellement avant de relancer un rebuild.
   */
  private async rebuildEntity(cfg: EntityConfig): Promise<number> {
    const lockKey = `search:rebuild:${cfg.indexName}`;
    const tempIndex = `${cfg.indexName}_v2`;

    const acquired = await this.acquireLock(lockKey);
    if (!acquired) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Un rebuild est déjà en cours pour cet index',
      });
    }

    try {
      this.logger.log(
        `rebuild: prépare le temp index "${tempIndex}" pour "${cfg.indexName}"`
      );

      // 1. Settings AVANT documents — sinon Meilisearch écrit des docs avec
      //    des défauts (pas de filterableAttributes, etc.) et la requête
      //    multi-tenant côté lecture (U7) plante immédiatement après le
      //    swap. On attend la tâche pour que les `settings` soient bien
      //    appliqués avant d'enchaîner les `addDocuments`.
      const settingsTask = await this.searchIndexer.ensureIndexSettings(
        tempIndex,
        cfg.settings
      );
      await this.searchIndexer.waitForTask(settingsTask.taskUid);

      // 2. Backfill des documents vers le temp index.
      const indexedCount = await cfg.reindex(tempIndex);

      // 3. Swap atomique. Meilisearch effectue le swap de manière
      //    transactionnelle — pas besoin de mode dégradé côté lecteurs.
      const swapTask = await this.searchIndexer.swapIndexes([
        // `rename: false` performs a content swap (the default desired
        // behaviour); `rename: true` would actually rename the index identifier.
        { indexes: [cfg.indexName, tempIndex], rename: false },
      ]);
      // On attend la complétion du swap : `deleteIndex(tempIndex)` qui suit
      // doit cibler l'index *post-swap* (= l'ancien contenu) et non un index
      // dans un état intermédiaire.
      await this.searchIndexer.waitForTask(swapTask.taskUid);

      // 4. Drop de l'ancien contenu (qui porte maintenant le nom temp).
      const deleteTask = await this.searchIndexer.deleteIndex(tempIndex);
      // Attente best-effort : un drop incomplet n'invalide pas le rebuild,
      // mais on logge l'échec pour qu'un opérateur le voie.
      try {
        await this.searchIndexer.waitForTask(deleteTask.taskUid);
      } catch (err) {
        this.logger.warn(
          `rebuild: drop du temp index "${tempIndex}" échoué (best-effort) — ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }

      this.logger.log(
        `rebuild: "${cfg.indexName}" reconstruit et swappé avec "${tempIndex}" (${indexedCount} document(s))`
      );

      return indexedCount;
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  // -------------------------------------------------------------------------
  // Redis lock primitives — `SET NX EX` pour le acquire, `DEL` pour release.
  // Pas de Lua RELEASE-with-token : on accepte qu'un opérateur déclenche un
  // release indu pendant le TTL ; c'est borné par les contraintes admin (5
  // req/min/user) et l'impact reste un second rebuild qui retrouverait un
  // temp index orphelin (signalé par les logs ci-dessus).
  // -------------------------------------------------------------------------

  private async acquireLock(key: string): Promise<boolean> {
    // `SET key value EX seconds NX` : pose la clé seulement si absente,
    // avec TTL. Renvoie 'OK' à l'acquisition, `null` si la clé existait.
    const result = await this.redis.set(
      key,
      '1',
      'EX',
      REBUILD_LOCK_TTL_SECONDS,
      'NX'
    );
    return result === 'OK';
  }

  private async releaseLock(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      // Échec de release : on logge sans propager — le TTL fera le reste.
      this.logger.warn(
        `release lock "${key}" échoué — ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  // -------------------------------------------------------------------------
  // Lookup table : entité → indexeur + settings + indexName.
  // -------------------------------------------------------------------------

  private entityConfig(entity: ReindexEntity): EntityConfig {
    switch (entity) {
      case 'plans':
        return {
          indexName: PLAN_INDEX,
          settings: PLAN_INDEX_SETTINGS,
          reindex: (targetIndex) => this.planIndexer.indexAll(targetIndex),
        };
      case 'fiches':
        return {
          indexName: FICHE_INDEX,
          settings: FICHE_INDEX_SETTINGS,
          reindex: (targetIndex) => this.ficheIndexer.indexAll(targetIndex),
        };
      case 'indicateurs':
        return {
          indexName: INDICATEUR_INDEX,
          settings: INDICATEUR_INDEX_SETTINGS,
          reindex: (targetIndex) =>
            this.indicateurIndexer.indexAll(targetIndex),
        };
      case 'actions':
        return {
          indexName: ACTION_INDEX,
          settings: ACTION_INDEX_SETTINGS,
          reindex: (targetIndex) => this.actionIndexer.indexAll(targetIndex),
        };
      case 'documents':
        return {
          indexName: DOCUMENT_INDEX,
          settings: DOCUMENT_INDEX_SETTINGS,
          reindex: (targetIndex) => this.documentIndexer.indexAll(targetIndex),
        };
    }
  }
}
