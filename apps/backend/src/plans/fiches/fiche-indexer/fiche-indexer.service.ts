import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/nestjs';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { classifyMeilisearchError } from '@tet/backend/utils/search-indexer/search-error.util';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import { type FicheSearchDoc } from '@tet/domain/plans';
import { getErrorMessage } from '@tet/domain/utils';
import { DefaultJobOptions, Job, Queue } from 'bullmq';
import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { FICHE_INDEX, FICHE_INDEX_SETTINGS } from './fiche-index.constants';

/**
 * Nom de la queue BullMQ portant les jobs d'indexation Meilisearch des fiches
 * actions / sous-actions. Co-localisé avec le service par convention (cf.
 * `SEARCH_INDEXING_PLAN_QUEUE_NAME` dans `plan-indexer.service.ts`). Les noms
 * de queues ne vivent PAS dans
 * `apps/backend/src/utils/bullmq/queue-names.constants.ts`.
 */
export const SEARCH_INDEXING_FICHE_QUEUE_NAME = 'search-indexing-fiche';

/**
 * Données portées par un job d'indexation de fiche.
 *
 * Le job ne transporte qu'un identifiant : le processeur recharge la ligne
 * canonique depuis la base — c'est ce qui garantit que le document indexé
 * reflète l'état post-commit, même si plusieurs jobs s'enchaînent sur la
 * même entité (cf. ADR 0006 sur l'éventuelle perte de jobs Redis).
 */
export interface FicheIndexerJobData {
  op: 'upsert' | 'delete';
  entityId: number;
}

/**
 * Taille de page utilisée par `indexAll()` pour parcourir la table
 * `fiche_action`. Mêmes choix que `PlanIndexerService.indexAll()` : 500
 * correspond au lot par défaut côté Meilisearch
 * (`SEARCH_INDEXER_DEFAULT_BATCH_SIZE`).
 */
const INDEX_ALL_PAGE_SIZE = 500;

/**
 * Valeur de repli pour `titre` lorsque la colonne DB est `NULL`.
 *
 * Le schéma `FicheSearchDoc` exige `titre: string`. Côté DB, la colonne `titre` est
 * nullable mais a la valeur par défaut `'Nouvelle action'` (voir
 * `fiche_action.table.ts`). Pour rester aligné avec ce que l'utilisateur voit
 * partout ailleurs dans l'application, on utilise la même chaîne de fallback
 * lorsque la valeur a été explicitement mise à NULL.
 */
const DEFAULT_FICHE_TITRE = 'Nouvelle action';

/**
 * Indexeur Meilisearch pour les fiches actions (et sous-actions).
 *
 * Modèle d'utilisation :
 *   - les services de mutation (create / update / delete / bulk-edit /
 *     share-fiche) appellent `enqueueUpsert(ficheId)`, `enqueueDelete(ficheId)`
 *     ou `enqueueUpsertMany(ficheIds)` APRÈS le commit de la transaction. Ils
 *     encapsulent l'appel dans un try/catch + `logger.warn` pour qu'une panne
 *     d'enqueue n'invalide pas l'opération métier (mêmes garanties que
 *     `WebhookService`).
 *   - le worker (cette même classe via `WorkerHost.process`) recharge la ligne
 *     `fiche_action`, joint `fiche_action_sharing` pour calculer
 *     `visible_collectivite_ids`, et délègue à `SearchIndexerService`.
 *   - l'admin backfill (U8) appelle `indexAll()` pour reconstruire l'index
 *     complet en lot de 500.
 *   - une tâche `@Cron('0 * * * *')` (sweep horaire) compense la fenêtre
 *     d'incohérence sur les changements de partage : si l'enqueue d'un
 *     unshare/share échoue silencieusement, la prochaine tournée du sweep
 *     ré-enfile l'upsert dans l'heure suivante.
 *
 * Champ `visible_collectivite_ids` : multi-valued = `[fiche.collectiviteId,
 * ...sharing rows.collectiviteId]`. C'est le filtre tenant côté lecture (U7) ;
 * il élimine la classe de bug "j'ai oublié de prendre en compte les fiches
 * partagées" en exposant une seule clé filtrable au moteur de recherche.
 *
 * Politique sur `fiche_action.deleted = true` : on n'indexe JAMAIS une fiche
 * soft-deleted (le loader filtre explicitement `deleted = false`). Quand un
 * service marque `deleted = true` et appelle `enqueueDelete`, le doc est
 * retiré de l'index ; on évite ainsi d'avoir à filtrer sur `deleted` dans
 * Meilisearch côté lecture.
 *
 * Politique sur `titre IS NULL` : la DB a un `default('Nouvelle action')`,
 * mais une mise à jour explicite à NULL reste possible. On retombe alors sur
 * la même chaîne que le défaut DB (`DEFAULT_FICHE_TITRE`) — contrairement à
 * `PlanIndexerService` qui ignore les axes sans nom, on indexe systématique-
 * ment toute fiche existante : un utilisateur s'attend à retrouver la fiche
 * qu'il a créée même s'il n'a pas encore renseigné le titre.
 */
@Injectable()
@Processor(SEARCH_INDEXING_FICHE_QUEUE_NAME)
export class FicheIndexerService
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(FicheIndexerService.name);

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
    @InjectQueue(SEARCH_INDEXING_FICHE_QUEUE_NAME)
    private readonly queue: Queue<FicheIndexerJobData>
  ) {
    super();
  }

  /**
   * Au démarrage du backend, on s'assure que l'index `fiches` existe avec les
   * bons réglages (searchable / filterable / tokenizer français).
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
        FICHE_INDEX,
        FICHE_INDEX_SETTINGS
      );
    } catch (err) {
      this.logger.warn(
        `Échec de l'application des réglages pour l'index "${FICHE_INDEX}" au démarrage : ${getErrorMessage(
          err
        )}.`
      );
    }
  }

  /**
   * Pousse un job d'indexation `upsert` pour `ficheId`.
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
  async enqueueUpsert(ficheId: number): Promise<void> {
    await this.queue.add(
      'upsert',
      { op: 'upsert', entityId: ficheId },
      { jobId: `fiches:upsert:${ficheId}` }
    );
  }

  /**
   * Pousse un job d'indexation `delete` pour `ficheId`.
   * Cf. `enqueueUpsert` pour la stratégie de `jobId`.
   */
  async enqueueDelete(ficheId: number): Promise<void> {
    await this.queue.add(
      'delete',
      { op: 'delete', entityId: ficheId },
      { jobId: `fiches:delete:${ficheId}` }
    );
  }

  /**
   * Pousse en lot un job `upsert` par fiche (`addBulk`).
   *
   * Utilisé par `bulk-edit.service.ts` (édition groupée), par
   * `share-fiche.service.ts` (partage en lot via `bulkShareFiches`) ainsi que
   * par le sweep horaire de récupération des partages. La déduplication est
   * la même que pour les enqueues unitaires (jobId =
   * `fiches:upsert:<ficheId>`).
   */
  async enqueueUpsertMany(ficheIds: number[]): Promise<void> {
    if (ficheIds.length === 0) {
      return;
    }
    // Dédupe locale : si l'appelant fournit deux fois le même id, on n'envoie
    // qu'un seul job. BullMQ déduplique de toute façon par `jobId`, mais
    // éviter le round-trip Redis est gratuit.
    const uniqueIds = Array.from(new Set(ficheIds));
    await this.queue.addBulk(
      uniqueIds.map((id) => ({
        name: 'upsert',
        data: { op: 'upsert' as const, entityId: id },
        opts: { jobId: `fiches:upsert:${id}` },
      }))
    );
  }

  /**
   * Réindexe la totalité des fiches non supprimées vers Meilisearch.
   *
   * Appelé par l'endpoint admin de backfill (U8). Pagine par `id` croissant
   * pour une parcours stable. Charge en parallèle l'agrégat de partages
   * (`fiche_action_sharing`) afin de calculer `visible_collectivite_ids` sans
   * faire un round-trip par fiche.
   *
   * @param targetIndex Nom de l'index Meilisearch cible. Par défaut on écrit
   *   vers `FICHE_INDEX` (l'index live). Le rebuild admin (U8 — `mode:
   *   'rebuild'`) passe ici le nom d'un index temporaire (`fiches_v2`) pour
   *   préparer le swap atomique sans toucher l'index lu en production.
   */
  async indexAll(targetIndex: string = FICHE_INDEX): Promise<number> {
    let offset = 0;
    let totalIndexed = 0;

    for (;;) {
      const rows = await this.databaseService.db
        .select({
          id: ficheActionTable.id,
          collectiviteId: ficheActionTable.collectiviteId,
          titre: ficheActionTable.titre,
          description: ficheActionTable.description,
          parentId: ficheActionTable.parentId,
        })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.deleted, false))
        .orderBy(asc(ficheActionTable.id))
        .limit(INDEX_ALL_PAGE_SIZE)
        .offset(offset);

      if (rows.length === 0) {
        break;
      }

      // Charge en bloc les partages pour les ids de la page (un seul aller-
      // retour DB par page, plutôt qu'un select par fiche).
      const ficheIds = rows.map((r) => r.id);
      const sharingRows = await this.databaseService.db
        .select({
          ficheId: ficheActionSharingTable.ficheId,
          collectiviteId: ficheActionSharingTable.collectiviteId,
        })
        .from(ficheActionSharingTable)
        .where(
          sql`${ficheActionSharingTable.ficheId} IN (${sql.join(
            ficheIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      const sharingByFicheId = new Map<number, number[]>();
      for (const sharing of sharingRows) {
        const list = sharingByFicheId.get(sharing.ficheId) ?? [];
        list.push(sharing.collectiviteId);
        sharingByFicheId.set(sharing.ficheId, list);
      }

      const docs: FicheSearchDoc[] = rows.map((row) => ({
        id: row.id,
        titre: row.titre ?? DEFAULT_FICHE_TITRE,
        description: row.description,
        parentId: row.parentId,
        visibleCollectiviteIds: [
          row.collectiviteId,
          ...(sharingByFicheId.get(row.id) ?? []),
        ],
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
      `indexAll: ${totalIndexed} fiche(s) indexée(s) vers "${targetIndex}"`
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
  async process(job: Job<FicheIndexerJobData>): Promise<void> {
    const { op, entityId } = job.data;
    this.logger.debug(
      `Processing ${op} job ${job.id} to index fiche ${entityId} (attempt ${
        job.attemptsMade + 1
      })`
    );

    try {
      if (op === 'delete') {
        await this.searchIndexer.delete(FICHE_INDEX, entityId);
        return;
      }

      // op === 'upsert'
      const doc = await this.loadFicheDoc(entityId);
      if (!doc) {
        // La fiche a été supprimée (ou soft-deleted) entre l'enqueue et le
        // traitement — un job de delete devrait suivre (ou avoir précédé).
        // On ne pousse pas un document fantôme dans Meilisearch.
        this.logger.debug(
          `Upsert job ${job.id} : fiche ${entityId} introuvable (supprimée ou soft-deleted) — no-op.`
        );
        return;
      }
      await this.searchIndexer.upsert(FICHE_INDEX, doc);
    } catch (err) {
      this.logger.warn(
        `Échec du job ${op} sur fiche ${entityId} : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      Sentry.captureException(err, {
        tags: {
          queue: SEARCH_INDEXING_FICHE_QUEUE_NAME,
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
   * Charge la ligne `fiche_action` correspondante (filtrée à
   * `deleted = false`) et calcule `visible_collectivite_ids` à partir des
   * lignes `fiche_action_sharing` associées. Renvoie `null` si la fiche
   * n'existe plus ou est soft-deleted.
   */
  private async loadFicheDoc(ficheId: number): Promise<FicheSearchDoc | null> {
    const [row] = await this.databaseService.db
      .select({
        id: ficheActionTable.id,
        collectiviteId: ficheActionTable.collectiviteId,
        titre: ficheActionTable.titre,
        description: ficheActionTable.description,
        parentId: ficheActionTable.parentId,
      })
      .from(ficheActionTable)
      .where(
        and(
          eq(ficheActionTable.id, ficheId),
          eq(ficheActionTable.deleted, false)
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const sharingRows = await this.databaseService.db
      .select({ collectiviteId: ficheActionSharingTable.collectiviteId })
      .from(ficheActionSharingTable)
      .where(eq(ficheActionSharingTable.ficheId, ficheId));

    return {
      id: row.id,
      titre: row.titre ?? DEFAULT_FICHE_TITRE,
      description: row.description,
      parentId: row.parentId,
      visibleCollectiviteIds: [
        row.collectiviteId,
        ...sharingRows.map((s) => s.collectiviteId),
      ],
    };
  }

  /**
   * Sweep horaire de récupération des partages.
   *
   * Pourquoi ce cron : si un appel à `enqueueUpsert` post-`shareFiche` /
   * `bulkShareFiches` échoue silencieusement (panne Redis ou perte du job
   * avant exécution), la fiche peut rester avec un `visible_collectivite_ids`
   * obsolète dans l'index — laissant une collectivité destinataire voir
   * encore (ou pas encore voir) une fiche après un changement de partage.
   * C'est une faille de cloisonnement, pas une simple dérive d'UI.
   *
   * Ce que le sweep peut couvrir :
   *  - Les **ajouts** de partage des dernières 60 minutes : on lit
   *    `fiche_action_sharing.created_at` et on ré-enfile un upsert pour
   *    chaque `fiche_id` distinct. Cela règle la fenêtre worst-case côté
   *    "je viens de partager mais l'index ne le reflète pas".
   *
   * Ce que le sweep NE peut PAS couvrir :
   *  - Les **suppressions** de partage : la table `fiche_action_sharing` est
   *    en hard-delete (sans tombstone ni colonne `deleted_at`, voir
   *    `fiche-action-sharing.table.ts`). Une fois la ligne supprimée, aucune
   *    trace ne permet de savoir quel `fiche_id` était concerné. La perte
   *    d'un enqueue post-`unshare` peut donc laisser une fiche partagée à
   *    une ex-collectivité destinataire jusqu'au prochain backfill admin
   *    complet (U8). Pour combler cette faille proprement, il faudra
   *    introduire une trace audit (table `fiche_action_sharing_log` ou
   *    colonne `deleted_at`) — explicitement hors-scope U4.
   *
   * Le `@Cron('0 * * * *')` se déclenche à chaque heure pile (minute = 0).
   * Il s'agit d'une stratégie de mitigation au sens d'ADR 0006, pas d'une
   * source de vérité.
   */
  @Cron('0 * * * *')
  async sharingRecoverySweep(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    try {
      const recentSharings = await this.databaseService.db
        .selectDistinct({ ficheId: ficheActionSharingTable.ficheId })
        .from(ficheActionSharingTable)
        .where(
          gte(ficheActionSharingTable.createdAt, oneHourAgo.toISOString())
        );

      const ficheIds = recentSharings.map((row) => row.ficheId);
      if (ficheIds.length === 0) {
        this.logger.debug(
          'Sharing-recovery sweep : aucune ligne fiche_action_sharing récente'
        );
        return;
      }

      this.logger.log(
        `Sharing-recovery sweep : ré-enfile ${ficheIds.length} fiche(s) partagée(s) dans la dernière heure`
      );
      await this.enqueueUpsertMany(ficheIds);
    } catch (err) {
      this.logger.warn(
        `Échec du sweep horaire de partages : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      Sentry.captureException(err, {
        tags: { queue: SEARCH_INDEXING_FICHE_QUEUE_NAME, op: 'sweep' },
      });
    }
  }
}
