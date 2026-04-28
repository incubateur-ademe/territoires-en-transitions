import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { classifyMeilisearchError } from '@tet/backend/utils/search-indexer/search-error.util';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import {
  DOCUMENT_INDEX,
  DOCUMENT_INDEX_SETTINGS,
} from './document-index.constants';
import { type DocumentSearchDoc } from '@tet/domain/collectivites';
import { getErrorMessage } from '@tet/domain/utils';
import { DefaultJobOptions, Job, Queue } from 'bullmq';
import { asc, eq } from 'drizzle-orm';

/**
 * Nom de la queue BullMQ portant les jobs d'indexation Meilisearch des
 * fichiers de la bibliothèque (`bibliotheque_fichier`). Co-localisé avec le
 * service par convention (cf. `SEARCH_INDEXING_PLAN_QUEUE_NAME` dans
 * `plan-indexer.service.ts`). Les noms de queues ne vivent PAS dans
 * `apps/backend/src/utils/bullmq/queue-names.constants.ts`.
 */
export const SEARCH_INDEXING_DOCUMENT_QUEUE_NAME = 'search-indexing-document';

/**
 * Données portées par un job d'indexation de document.
 *
 * Le job ne transporte qu'un identifiant : le processeur recharge la ligne
 * canonique depuis la base — c'est ce qui garantit que le document indexé
 * reflète l'état post-commit, même si plusieurs jobs s'enchaînent sur la
 * même entité (cf. ADR 0006 sur l'éventuelle perte de jobs Redis).
 */
export interface DocumentIndexerJobData {
  op: 'upsert' | 'delete';
  entityId: number;
}

/**
 * Taille de page utilisée par `indexAll()` pour parcourir la table
 * `bibliotheque_fichier`. Mêmes choix que les autres indexeurs (`PlanIndexer`,
 * `IndicateurIndexer`) : 500 correspond au lot par défaut côté Meilisearch
 * (`SEARCH_INDEXER_DEFAULT_BATCH_SIZE`).
 */
const INDEX_ALL_PAGE_SIZE = 500;

/**
 * Indexeur Meilisearch pour les documents (`bibliotheque_fichier`).
 *
 * Modèle d'utilisation :
 *   - les services de mutation (`StoreDocumentService.storeDocument`,
 *     `UpdateDocumentService.updateDocument`) appellent `enqueueUpsert(id)`
 *     APRÈS le commit. Ils encapsulent l'appel dans un try/catch + `logger.warn`
 *     pour qu'une panne d'enqueue n'invalide pas l'opération métier (mêmes
 *     garanties que `WebhookService`).
 *   - `enqueueDelete(id)` est exposé pour les futurs chemins de suppression :
 *     en v1 il n'existe pas de service de suppression de fichier en
 *     production, mais l'opération est nécessaire pour purger un document de
 *     l'index si une suppression est ajoutée plus tard (et est utilisée par les
 *     tests).
 *   - le worker (cette même classe via `WorkerHost.process`) recharge la ligne
 *     `bibliotheque_fichier`, mappe vers `DocumentSearchDoc`, et délègue à
 *     `SearchIndexerService`.
 *   - l'admin backfill (U8) appelle `indexAll()` pour reconstruire l'index
 *     complet en lot de 500.
 *
 * Dualité collectivité-scopée vs globale : la table porte les deux. Les
 * fichiers d'une collectivité ont `collectivite_id = <id>` ; les fichiers
 * "système" (rares mais possibles, cf. modèle nullable) ont `collectivite_id
 * IS NULL` et sont visibles depuis n'importe quelle collectivité. Le filtre
 * tenant côté lecture (U7) est :
 *
 *     `(collectivite_id IS NULL OR collectivite_id = ${currentCollectiviteId})`
 *
 * Champs non indexés en v1 :
 *   - `confidentiel` : la confidentialité d'un fichier est aujourd'hui
 *     uniquement filtrée à l'accès (cf. `DocumentService.downloadFile`) ;
 *     l'index ne dénormalise pas ce flag — un fichier confidentiel apparaît
 *     dans la modale de recherche pour les membres de sa collectivité, ce qui
 *     reflète le comportement déjà visible côté lecture (les listes de fichiers
 *     ne masquent pas non plus le titre des fichiers confidentiels).
 *   - `hash` : opaque (SHA-256), inutile en recherche textuelle.
 *
 * Politique sur `filename IS NULL` : la colonne est nullable côté DB mais le
 * schéma `DocumentSearchDoc` exige `filename: string`. On traite ce cas comme un
 * no-op (debug log + skip) — un résultat sans nom de fichier serait
 * ininterprétable côté UX, comme pour les axes sans nom dans `PlanIndexer`.
 */
@Injectable()
@Processor(SEARCH_INDEXING_DOCUMENT_QUEUE_NAME)
export class DocumentIndexerService
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(DocumentIndexerService.name);

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
    @InjectQueue(SEARCH_INDEXING_DOCUMENT_QUEUE_NAME)
    private readonly queue: Queue<DocumentIndexerJobData>
  ) {
    super();
  }

  /**
   * Au démarrage du backend, on s'assure que l'index `documents` existe avec
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
        DOCUMENT_INDEX,
        DOCUMENT_INDEX_SETTINGS
      );
    } catch (err) {
      this.logger.warn(
        `Échec de l'application des réglages pour l'index "${DOCUMENT_INDEX}" au démarrage : ${getErrorMessage(
          err
        )}.`
      );
    }
  }

  /**
   * Pousse un job d'indexation `upsert` pour `fichierId`.
   *
   * `jobId` est dérivé de l'opération + l'identifiant pour que BullMQ
   * déduplique : si deux mutations consécutives sur la même entité sont commit
   * avant que la queue n'ait commencé à traiter le premier job, seul un job
   * survit (et le processeur lira la ligne post-deuxième-commit). On ne veut
   * pas indexer un état intermédiaire.
   */
  async enqueueUpsert(fichierId: number): Promise<void> {
    await this.queue.add(
      'upsert',
      { op: 'upsert', entityId: fichierId },
      { jobId: `documents:upsert:${fichierId}` }
    );
  }

  /**
   * Pousse un job d'indexation `delete` pour `fichierId`.
   * Cf. `enqueueUpsert` pour la stratégie de `jobId`.
   */
  async enqueueDelete(fichierId: number): Promise<void> {
    await this.queue.add(
      'delete',
      { op: 'delete', entityId: fichierId },
      { jobId: `documents:delete:${fichierId}` }
    );
  }

  /**
   * Réindexe la totalité de la table `bibliotheque_fichier` vers Meilisearch.
   *
   * Appelé par l'endpoint admin de backfill (U8). Pagine par `id` croissant
   * pour un parcours stable (les nouveaux fichiers créés en cours de rebuild
   * sont vus si leur id > au curseur ; sinon le swap atomique de U8 les
   * récupérera dans le rebuild suivant).
   *
   * Les lignes avec `filename IS NULL` sont ignorées (cf. note sur le schéma).
   *
   * @param targetIndex Nom de l'index Meilisearch cible. Par défaut on écrit
   *   vers `DOCUMENT_INDEX` (l'index live). Le rebuild admin (U8 — `mode:
   *   'rebuild'`) passe ici le nom d'un index temporaire (`documents_v2`)
   *   pour préparer le swap atomique sans toucher l'index lu en production.
   */
  async indexAll(targetIndex: string = DOCUMENT_INDEX): Promise<number> {
    let offset = 0;
    let totalIndexed = 0;
    let totalSkipped = 0;

    for (;;) {
      const rows = await this.databaseService.db
        .select({
          id: bibliothequeFichierTable.id,
          collectiviteId: bibliothequeFichierTable.collectiviteId,
          filename: bibliothequeFichierTable.filename,
        })
        .from(bibliothequeFichierTable)
        .orderBy(asc(bibliothequeFichierTable.id))
        .limit(INDEX_ALL_PAGE_SIZE)
        .offset(offset);

      if (rows.length === 0) {
        break;
      }

      const docs: DocumentSearchDoc[] = [];
      for (const row of rows) {
        if (row.filename === null) {
          totalSkipped++;
          continue;
        }
        docs.push({
          id: row.id,
          collectiviteId: row.collectiviteId,
          filename: row.filename,
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
      `indexAll: ${totalIndexed} fichier(s) indexé(s) vers "${targetIndex}"` +
        (totalSkipped > 0
          ? `, ${totalSkipped} ligne(s) sans filename ignorée(s)`
          : '')
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
  async process(job: Job<DocumentIndexerJobData>): Promise<void> {
    const { op, entityId } = job.data;
    this.logger.debug(
      `Processing ${op} job ${job.id} for fichier ${entityId} (attempt ${
        job.attemptsMade + 1
      })`
    );

    try {
      if (op === 'delete') {
        await this.searchIndexer.delete(DOCUMENT_INDEX, entityId);
        return;
      }

      // op === 'upsert'
      const doc = await this.loadDocumentDoc(entityId);
      if (!doc) {
        // Ligne supprimée entre l'enqueue et le traitement, ou `filename IS
        // NULL` — on ne pousse pas un document fantôme dans Meilisearch.
        this.logger.debug(
          `Upsert job ${job.id} : fichier ${entityId} introuvable ou sans filename — no-op.`
        );
        return;
      }
      await this.searchIndexer.upsert(DOCUMENT_INDEX, doc);
    } catch (err) {
      this.logger.warn(
        `Échec du job ${op} sur fichier ${entityId} : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      Sentry.captureException(err, {
        tags: {
          queue: SEARCH_INDEXING_DOCUMENT_QUEUE_NAME,
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
   * Charge la ligne `bibliotheque_fichier` correspondante et la mappe en
   * `DocumentSearchDoc`. Renvoie `null` si :
   *  - la ligne n'existe plus (suppression entre enqueue et process), ou
   *  - la ligne existe mais `filename IS NULL` (cf. politique en tête de
   *    fichier).
   */
  private async loadDocumentDoc(
    fichierId: number
  ): Promise<DocumentSearchDoc | null> {
    const [row] = await this.databaseService.db
      .select({
        id: bibliothequeFichierTable.id,
        collectiviteId: bibliothequeFichierTable.collectiviteId,
        filename: bibliothequeFichierTable.filename,
      })
      .from(bibliothequeFichierTable)
      .where(eq(bibliothequeFichierTable.id, fichierId))
      .limit(1);

    if (!row) {
      return null;
    }
    if (row.filename === null) {
      return null;
    }

    return {
      id: row.id,
      collectiviteId: row.collectiviteId,
      filename: row.filename,
    };
  }
}
