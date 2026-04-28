import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { classifyMeilisearchError } from '@tet/backend/utils/search-indexer/search-error.util';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import {
  INDICATEUR_INDEX,
  INDICATEUR_INDEX_SETTINGS,
} from './indicateur-index.constants';
import { type IndicateurSearchDoc } from '@tet/domain/indicateurs';
import { getErrorMessage } from '@tet/domain/utils';
import { DefaultJobOptions, Job, Queue } from 'bullmq';
import { asc, eq } from 'drizzle-orm';

/**
 * Nom de la queue BullMQ portant les jobs d'indexation Meilisearch des
 * définitions d'indicateurs (prédéfinis et personnalisés). Co-localisé avec le
 * service par convention (cf. `SEARCH_INDEXING_PLAN_QUEUE_NAME` dans
 * `plan-indexer.service.ts`). Les noms de queues ne vivent PAS dans
 * `apps/backend/src/utils/bullmq/queue-names.constants.ts`.
 */
export const SEARCH_INDEXING_INDICATEUR_QUEUE_NAME =
  'search-indexing-indicateur';

/**
 * Données portées par un job d'indexation d'indicateur.
 *
 * Le job ne transporte qu'un identifiant : le processeur recharge la ligne
 * canonique depuis la base — c'est ce qui garantit que le document indexé
 * reflète l'état post-commit, même si plusieurs jobs s'enchaînent sur la
 * même entité (cf. ADR 0006 sur l'éventuelle perte de jobs Redis).
 */
export interface IndicateurIndexerJobData {
  op: 'upsert' | 'delete';
  entityId: number;
}

/**
 * Taille de page utilisée par `indexAll()` pour parcourir la table
 * `indicateur_definition`. Mêmes choix que `PlanIndexerService.indexAll()` :
 * 500 correspond au lot par défaut côté Meilisearch
 * (`SEARCH_INDEXER_DEFAULT_BATCH_SIZE`).
 */
const INDEX_ALL_PAGE_SIZE = 500;

/**
 * Indexeur Meilisearch pour les définitions d'indicateurs.
 *
 * Modèle d'utilisation :
 *   - les services de mutation (create / update / delete) appellent
 *     `enqueueUpsert(indicateurId)` ou `enqueueDelete(indicateurId)` APRÈS le
 *     commit de la transaction. Ils encapsulent l'appel dans un try/catch +
 *     `logger.warn` pour qu'une panne d'enqueue n'invalide pas l'opération
 *     métier (mêmes garanties que `WebhookService`).
 *   - l'import depuis Google Sheets (`ImportIndicateurDefinitionService`)
 *     appelle `enqueueUpsertMany(ids)` après l'import pour rafraîchir tous
 *     les documents impactés en un seul `addBulk` Redis.
 *   - le worker (cette même classe via `WorkerHost.process`) recharge la ligne
 *     `indicateur_definition`, mappe vers `IndicateurSearchDoc`, et délègue à
 *     `SearchIndexerService`.
 *   - l'admin backfill (U8) appelle `indexAll()` pour reconstruire l'index
 *     complet en lot de 500.
 *
 * Indicateurs prédéfinis vs personnalisés : la table `indicateur_definition`
 * porte les deux. Les prédéfinis ont `collectivite_id IS NULL` (globaux,
 * visibles depuis n'importe quelle collectivité) ; les personnalisés ont
 * `collectivite_id = <id>` (scopés à une seule collectivité). Le filtre
 * tenant côté lecture (U7) est donc :
 *
 *     `(collectivite_id IS NULL OR collectivite_id = ${currentCollectiviteId})`
 *
 * Pas de "is_personnalise" dénormalisé : le booléen se déduit côté UI via
 * `collectivite_id !== null`. Pas non plus de dénormalisation de
 * `indicateur_collectivite` (commentaire / favoris / confidentiel) ni des
 * tags `thematiques` / `services` / `pilotes` : seuls les champs
 * définition-level vivent dans le doc (cf. `IndicateurSearchDocSchema` dans U2).
 *
 * Politique sur `titre IS NULL` : la colonne est `notNull` côté DB
 * (`indicateur-definition.table.ts` ligne 29) — pas de fallback nécessaire,
 * contrairement aux fiches.
 */
@Injectable()
@Processor(SEARCH_INDEXING_INDICATEUR_QUEUE_NAME)
export class IndicateurIndexerService
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(IndicateurIndexerService.name);

  /**
   * Options par défaut appliquées aux jobs poussés sur cette queue.
   * Mêmes valeurs que `PlanIndexerService.DEFAULT_JOB_OPTIONS` (mêmes
   * contraintes sur la dépendance Meilisearch).
   */
  static readonly DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
    removeOnComplete: 1000,
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly searchIndexer: SearchIndexerService,
    @InjectQueue(SEARCH_INDEXING_INDICATEUR_QUEUE_NAME)
    private readonly queue: Queue<IndicateurIndexerJobData>
  ) {
    super();
  }

  /**
   * Au démarrage du backend, on s'assure que l'index `indicateurs` existe avec
   * les bons réglages (searchable / filterable / tokenizer français).
   *
   * `ensureIndexSettings` crée l'index s'il n'existe pas (`getRawIndex` →
   * `createIndex` sur `index_not_found`) puis applique les réglages — l'appel
   * est idempotent, le réappliquer à chaque boot est un no-op rapide.
   *
   * Toute panne Meilisearch est *loguée* mais NE doit PAS faire échouer le
   * bootstrap : Meilisearch est une dépendance externe, son indisponibilité
   * doit être tolérée.
   */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.searchIndexer.ensureIndexSettings(
        INDICATEUR_INDEX,
        INDICATEUR_INDEX_SETTINGS
      );
    } catch (err) {
      this.logger.warn(
        `Échec de l'application des réglages pour l'index "${INDICATEUR_INDEX}" au démarrage : ${getErrorMessage(
          err
        )}.`
      );
    }
  }

  /**
   * Pousse un job d'indexation `upsert` pour `indicateurId`.
   *
   * `jobId` est dérivé de l'opération + l'identifiant pour que BullMQ
   * déduplique : si deux mutations consécutives sur la même entité sont commit
   * avant que la queue n'ait commencé à traiter le premier job, seul un job
   * survit (et le processeur lira la ligne post-deuxième-commit). On ne veut
   * pas indexer un état intermédiaire.
   *
   * Le namespace `upsert` est différent de `delete` (cf. `enqueueDelete`)
   * pour qu'un upsert et un delete pendants ne se masquent pas mutuellement
   * dans la file : ce sont deux opérations distinctes qui doivent toutes deux
   * traverser le worker.
   */
  async enqueueUpsert(indicateurId: number): Promise<void> {
    await this.queue.add(
      'upsert',
      { op: 'upsert', entityId: indicateurId },
      { jobId: `indicateurs:upsert:${indicateurId}` }
    );
  }

  /**
   * Pousse un job d'indexation `delete` pour `indicateurId`.
   * Cf. `enqueueUpsert` pour la stratégie de `jobId`.
   */
  async enqueueDelete(indicateurId: number): Promise<void> {
    await this.queue.add(
      'delete',
      { op: 'delete', entityId: indicateurId },
      { jobId: `indicateurs:delete:${indicateurId}` }
    );
  }

  /**
   * Pousse en lot un job `upsert` par indicateur (`addBulk`).
   *
   * Utilisé par `ImportIndicateurDefinitionService` (import Google Sheets) :
   * après un import couvrant des centaines voire des milliers d'indicateurs,
   * on ne veut pas saturer Redis avec autant d'appels `add()` individuels.
   * `addBulk` envoie tout dans un seul aller-retour. La déduplication par
   * `jobId` est la même que pour les enqueues unitaires.
   */
  async enqueueUpsertMany(indicateurIds: number[]): Promise<void> {
    if (indicateurIds.length === 0) {
      return;
    }
    // Dédupe locale : si l'appelant fournit deux fois le même id, on n'envoie
    // qu'un seul job. BullMQ déduplique de toute façon par `jobId`, mais
    // éviter le round-trip Redis est gratuit.
    const uniqueIds = Array.from(new Set(indicateurIds));
    await this.queue.addBulk(
      uniqueIds.map((id) => ({
        name: 'upsert',
        data: { op: 'upsert' as const, entityId: id },
        opts: { jobId: `indicateurs:upsert:${id}` },
      }))
    );
  }

  /**
   * Réindexe la totalité de la table `indicateur_definition` vers Meilisearch.
   *
   * Appelé par l'endpoint admin de backfill (U8). Pagine par `id` croissant
   * pour un parcours stable (les nouveaux indicateurs créés en cours de
   * rebuild sont vus si leur id > au curseur ; sinon le swap atomique de U8
   * les récupérera dans le rebuild suivant).
   *
   * @param targetIndex Nom de l'index Meilisearch cible. Par défaut on écrit
   *   vers `INDICATEUR_INDEX` (l'index live). Le rebuild admin (U8 — `mode:
   *   'rebuild'`) passe ici le nom d'un index temporaire (`indicateurs_v2`)
   *   pour préparer le swap atomique sans toucher l'index lu en production.
   */
  async indexAll(targetIndex: string = INDICATEUR_INDEX): Promise<number> {
    let offset = 0;
    let totalIndexed = 0;

    for (;;) {
      const rows = await this.databaseService.db
        .select({
          id: indicateurDefinitionTable.id,
          identifiantReferentiel:
            indicateurDefinitionTable.identifiantReferentiel,
          collectiviteId: indicateurDefinitionTable.collectiviteId,
          groupementId: indicateurDefinitionTable.groupementId,
          titre: indicateurDefinitionTable.titre,
          titreLong: indicateurDefinitionTable.titreLong,
          description: indicateurDefinitionTable.description,
        })
        .from(indicateurDefinitionTable)
        .orderBy(asc(indicateurDefinitionTable.id))
        .limit(INDEX_ALL_PAGE_SIZE)
        .offset(offset);

      if (rows.length === 0) {
        break;
      }

      const docs: IndicateurSearchDoc[] = rows.map((row) => ({
        id: row.id,
        identifiantReferentiel: row.identifiantReferentiel,
        collectiviteId: row.collectiviteId,
        groupementId: row.groupementId,
        titre: row.titre,
        titreLong: row.titreLong,
        description: row.description,
      }));

      if (docs.length > 0) {
        await this.searchIndexer.bulkUpsert(targetIndex, docs);
        totalIndexed += docs.length;
      }

      offset += INDEX_ALL_PAGE_SIZE;
      if (rows.length < INDEX_ALL_PAGE_SIZE) {
        break;
      }
    }

    this.logger.log(
      `indexAll: ${totalIndexed} indicateur(s) indexé(s) vers "${targetIndex}"`
    );

    return totalIndexed;
  }

  /**
   * Point d'entrée du worker BullMQ.
   *
   * Stratégie d'erreur identique à `PlanIndexerService.process` :
   *  - on capte toute exception remontée par `searchIndexer.*` ;
   *  - on délègue à `classifyMeilisearchError` (UnrecoverableError pour les
   *    erreurs permanentes ; ré-throw pour les retryables) ;
   *  - on remonte un breadcrumb Sentry pour toute erreur.
   */
  async process(job: Job<IndicateurIndexerJobData>): Promise<void> {
    const { op, entityId } = job.data;
    this.logger.debug(
      `Processing ${op} job ${job.id} for indicateur ${entityId} (attempt ${
        job.attemptsMade + 1
      })`
    );

    try {
      if (op === 'delete') {
        await this.searchIndexer.delete(INDICATEUR_INDEX, entityId);
        return;
      }

      // op === 'upsert'
      const doc = await this.loadIndicateurDoc(entityId);
      if (!doc) {
        // L'indicateur a été supprimé entre l'enqueue et le traitement —
        // un job de delete devrait suivre (ou avoir précédé). On ne pousse
        // pas un document fantôme dans Meilisearch.
        this.logger.debug(
          `Upsert job ${job.id} : indicateur ${entityId} introuvable — no-op.`
        );
        return;
      }
      await this.searchIndexer.upsert(INDICATEUR_INDEX, doc);
    } catch (err) {
      this.logger.warn(
        `Échec du job ${op} sur indicateur ${entityId} : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      Sentry.captureException(err, {
        tags: {
          queue: SEARCH_INDEXING_INDICATEUR_QUEUE_NAME,
          op,
        },
        extra: {
          entityId,
          jobId: job.id,
          attemptsMade: job.attemptsMade,
        },
      });
      throw classifyMeilisearchError(err);
    }
  }

  /**
   * Charge la ligne `indicateur_definition` correspondante et la mappe en
   * `IndicateurSearchDoc`. Renvoie `null` si la ligne n'existe plus.
   */
  private async loadIndicateurDoc(
    indicateurId: number
  ): Promise<IndicateurSearchDoc | null> {
    const [row] = await this.databaseService.db
      .select({
        id: indicateurDefinitionTable.id,
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
        collectiviteId: indicateurDefinitionTable.collectiviteId,
        groupementId: indicateurDefinitionTable.groupementId,
        titre: indicateurDefinitionTable.titre,
        titreLong: indicateurDefinitionTable.titreLong,
        description: indicateurDefinitionTable.description,
      })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.id, indicateurId))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      identifiantReferentiel: row.identifiantReferentiel,
      collectiviteId: row.collectiviteId,
      groupementId: row.groupementId,
      titre: row.titre,
      titreLong: row.titreLong,
      description: row.description,
    };
  }
}
