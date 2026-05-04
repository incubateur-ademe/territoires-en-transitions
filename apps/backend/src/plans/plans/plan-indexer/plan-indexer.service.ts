import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { classifyMeilisearchError } from '@tet/backend/utils/search-indexer/search-error.util';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import { type AxeSearchDoc } from '@tet/domain/plans';
import { getErrorMessage } from '@tet/domain/utils';
import { DefaultJobOptions, Job, Queue } from 'bullmq';
import { asc, eq } from 'drizzle-orm';
import { PLAN_INDEX, PLAN_INDEX_SETTINGS } from './plan-index.constants';

/**
 * Nom de la queue BullMQ portant les jobs d'indexation Meilisearch des
 * plans / axes. Co-localisé avec le service par convention (cf. la queue de
 * génération de rapports `PLAN_REPORT_GENERATION_QUEUE_NAME` dans
 * `generate-reports.application-service.ts`). Les noms de queues ne vivent
 * PAS dans `apps/backend/src/utils/bullmq/queue-names.constants.ts`.
 */
export const SEARCH_INDEXING_PLAN_QUEUE_NAME = 'search-indexing-plan';

/**
 * Données portées par un job d'indexation de plan.
 *
 * Le job ne transporte qu'un identifiant : le processeur recharge la ligne
 * canonique depuis la base — c'est ce qui garantit que le document indexé
 * reflète l'état post-commit, même si plusieurs jobs s'enchaînent sur la
 * même entité (cf. ADR 0006 sur l'éventuelle perte de jobs Redis).
 */
export interface PlanIndexerJobData {
  op: 'upsert' | 'delete';
  entityId: number;
}

/**
 * Taille de page utilisée par `indexAll()` pour parcourir la table `axe`.
 *
 * 500 correspond à la taille de lot par défaut côté Meilisearch
 * (`SEARCH_INDEXER_DEFAULT_BATCH_SIZE`) : on garde la symétrie pour qu'un lot
 * lu corresponde à un lot poussé.
 */
const INDEX_ALL_PAGE_SIZE = 500;

/**
 * Indexeur Meilisearch pour les plans / axes.
 *
 * Modèle d'utilisation :
 *   - les services de mutation (upsert / delete / create-plan-aggregate /
 *     import-plan) appellent `enqueueUpsert(planId)` ou `enqueueDelete(planId)`
 *     APRÈS le commit de la transaction. Ils encapsulent l'appel dans un
 *     try/catch + `logger.warn` pour qu'une panne d'enqueue n'invalide pas
 *     l'opération métier (mêmes garanties que `WebhookService`).
 *   - le worker (cette même classe via `WorkerHost.process`) recharge la ligne
 *     `axe`, mappe vers `AxeSearchDoc`, et délègue à `SearchIndexerService`.
 *   - l'admin backfill (U8) appelle `indexAll()` pour reconstruire l'index
 *     complet en lot de 500.
 *
 * Hiérarchie : on indexe TOUTES les lignes `axe` (plans racine *et*
 * sous-axes) — `parent_id IS NULL` distingue les racines. Le champ
 * `parent_id` est exposé pour permettre au proxy U7 un éventuel filtre par
 * branche ou un rendu en fil d'Ariane.
 *
 * Politique sur `axe.nom IS NULL` : la colonne est nullable côté DB mais le
 * schéma `AxeSearchDoc` exige `nom: string`. Plutôt que de fabriquer un faux titre
 * (`""`), qui polluerait le ranking et apparaîtrait comme un "résultat
 * fantôme" dans la modale globale, on traite ce cas comme un no-op : on logge
 * un debug et on ne pousse pas le document. Conséquence : un axe sans nom
 * n'est pas indexé, ce qui est aligné avec la sémantique de la modale (un
 * résultat sans titre est ininterprétable côté UX).
 */
@Injectable()
@Processor(SEARCH_INDEXING_PLAN_QUEUE_NAME)
export class PlanIndexerService
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(PlanIndexerService.name);

  /**
   * Options par défaut appliquées aux jobs poussés sur cette queue.
   *
   * - `removeOnComplete: 1000` : on garde la trace des 1000 derniers jobs
   *   réussis pour le debug / Bull-Board ; au-delà, BullMQ purge.
   * - `attempts: 10` + `exponential` 1s : un incident Meilisearch transitoire
   *   (timeout, 503) est presque toujours résolu en quelques minutes ; 10
   *   tentatives en exponentiel ≈ ~17 min de fenêtre de récupération avant
   *   échec définitif.
   *
   * Mêmes valeurs que `WebhookService.DEFAULT_JOB_OPTIONS` — mêmes contraintes
   * (dépendance HTTP externe avec pannes courtes possibles), donc même profil.
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
    @InjectQueue(SEARCH_INDEXING_PLAN_QUEUE_NAME)
    private readonly queue: Queue<PlanIndexerJobData>
  ) {
    super();
  }

  /**
   * Au démarrage du backend, on s'assure que l'index `plans` existe avec les
   * bons réglages (searchable / filterable / tokenizer français).
   *
   * `ensureIndexSettings` crée l'index s'il n'existe pas (`getRawIndex` →
   * `createIndex` sur `index_not_found`) puis applique les réglages — l'appel
   * est idempotent, le réappliquer à chaque boot est un no-op rapide.
   *
   * Toute panne Meilisearch est *loguée* mais NE doit PAS faire échouer le
   * bootstrap : Meilisearch est une dépendance externe, son indisponibilité
   * doit être tolérée. Les jobs d'indexation retenteront en backoff lorsque
   * le service redeviendra joignable.
   */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.searchIndexer.ensureIndexSettings(
        PLAN_INDEX,
        PLAN_INDEX_SETTINGS
      );
    } catch (err) {
      this.logger.warn(
        `Échec de l'application des réglages pour l'index "${PLAN_INDEX}" au démarrage : ${getErrorMessage(
          err
        )}.`
      );
    }
  }

  /**
   * Pousse un job d'indexation `upsert` pour `planId`.
   *
   * `jobId` est dérivé de l'opération + l'identifiant pour que BullMQ
   * déduplique : si deux mutations consécutives sur la même entité sont
   * commit avant que la queue n'ait commencé à traiter le premier job, seul
   * un job survit (et le processeur lira la ligne post-deuxième-commit).
   * C'est la sémantique attendue : on ne veut pas indexer un état
   * intermédiaire.
   */
  async enqueueUpsert(planId: number): Promise<void> {
    await this.queue.add(
      'upsert',
      { op: 'upsert', entityId: planId },
      { jobId: `plans:upsert:${planId}` }
    );
  }

  /**
   * Pousse un job d'indexation `delete` pour `planId`.
   *
   * Cf. `enqueueUpsert` pour la stratégie de `jobId`.
   */
  async enqueueDelete(planId: number): Promise<void> {
    await this.queue.add(
      'delete',
      { op: 'delete', entityId: planId },
      { jobId: `plans:delete:${planId}` }
    );
  }

  /**
   * Réindexe la totalité de la table `axe` vers Meilisearch.
   *
   * Appelé par l'endpoint admin de backfill (U8). Pagine par `id` croissant
   * pour une parcours stable (les nouveaux axes créés en cours de rebuild
   * sont vus si leur id > au curseur, sinon le swap atomique de U8 les
   * récupérera dans le rebuild suivant).
   *
   * Les lignes avec `nom IS NULL` sont ignorées (cf. note sur le schéma).
   *
   * @param targetIndex Nom de l'index Meilisearch cible. Par défaut on écrit
   *   vers `PLAN_INDEX` (l'index live). Le rebuild admin (U8 — `mode:
   *   'rebuild'`) passe ici le nom d'un index temporaire (`plans_v2`) pour
   *   préparer le swap atomique sans toucher l'index lu en production.
   */
  async indexAll(targetIndex: string = PLAN_INDEX): Promise<number> {
    let offset = 0;
    let totalIndexed = 0;
    let totalSkipped = 0;

    for (;;) {
      const rows = await this.databaseService.db
        .select({
          id: axeTable.id,
          collectiviteId: axeTable.collectiviteId,
          nom: axeTable.nom,
          parent: axeTable.parent,
          plan: axeTable.plan,
        })
        .from(axeTable)
        .orderBy(asc(axeTable.id))
        .limit(INDEX_ALL_PAGE_SIZE)
        .offset(offset);

      if (rows.length === 0) {
        break;
      }

      const docs: AxeSearchDoc[] = [];
      for (const row of rows) {
        if (row.nom === null) {
          totalSkipped++;
          continue;
        }
        docs.push({
          id: row.id,
          collectiviteId: row.collectiviteId,
          nom: row.nom,
          parent: row.parent,
          plan: row.plan ?? row.id,
        });
      }

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
      `indexAll: ${totalIndexed} axe(s) indexé(s) vers "${targetIndex}"` +
        (totalSkipped > 0
          ? `, ${totalSkipped} ligne(s) sans nom ignorée(s)`
          : '')
    );

    return totalIndexed;
  }

  /**
   * Point d'entrée du worker BullMQ.
   *
   * Stratégie d'erreur :
   *  - on capte toute exception remontée par `searchIndexer.*` ;
   *  - on délègue à `classifyMeilisearchError` qui renvoie soit un
   *    `UnrecoverableError` (BullMQ ne retentera pas) soit l'erreur d'origine
   *    (BullMQ retentera selon `DEFAULT_JOB_OPTIONS`).
   *  - on remonte un breadcrumb Sentry pour toute erreur — la queue ne loggue
   *    pas de stack autrement.
   *
   * Les erreurs DB (chargement de la ligne `axe`) ne sont pas enveloppées :
   * elles sont retentables par défaut (probablement un timeout pool
   * éphémère).
   */
  async process(job: Job<PlanIndexerJobData>): Promise<void> {
    const { op, entityId } = job.data;
    this.logger.log(
      `Processing ${op} job ${job.id} to index axe ${entityId} (attempt ${
        job.attemptsMade + 1
      })`
    );

    try {
      if (op === 'delete') {
        await this.searchIndexer.delete(PLAN_INDEX, entityId);
        return;
      }

      // op === 'upsert'
      const doc = await this.loadPlanDoc(entityId);
      if (!doc) {
        // Ligne supprimée entre l'enqueue et le traitement — un job de
        // delete devrait suivre (ou avoir précédé). On ne pousse pas un
        // document fantôme dans Meilisearch.
        this.logger.debug(
          `Upsert job ${job.id} : axe ${entityId} introuvable ou sans nom — no-op.`
        );
        return;
      }
      await this.searchIndexer.upsert(PLAN_INDEX, doc);
    } catch (err) {
      this.logger.warn(
        `Échec du job ${op} sur axe ${entityId} : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      Sentry.captureException(err, {
        tags: {
          queue: SEARCH_INDEXING_PLAN_QUEUE_NAME,
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
   * Charge la ligne `axe` correspondante et la mappe en `AxeSearchDoc`.
   *
   * Renvoie `null` si :
   *  - la ligne n'existe plus (suppression entre enqueue et process), ou
   *  - la ligne existe mais `nom IS NULL` (cf. politique en tête de fichier).
   */
  private async loadPlanDoc(planId: number): Promise<AxeSearchDoc | null> {
    const [row] = await this.databaseService.db
      .select({
        id: axeTable.id,
        collectiviteId: axeTable.collectiviteId,
        nom: axeTable.nom,
        parent: axeTable.parent,
        plan: axeTable.plan,
      })
      .from(axeTable)
      .where(eq(axeTable.id, planId))
      .limit(1);

    if (!row) {
      return null;
    }
    if (row.nom === null) {
      return null;
    }

    return {
      id: row.id,
      collectiviteId: row.collectiviteId,
      nom: row.nom,
      parent: row.parent,
      plan: row.plan ?? row.id,
    };
  }
}
