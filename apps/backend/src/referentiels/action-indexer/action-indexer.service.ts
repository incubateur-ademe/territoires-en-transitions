import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { actionCommentaireTable } from '@tet/backend/referentiels/models/action-commentaire.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { referentielDefinitionTable } from '@tet/backend/referentiels/models/referentiel-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { classifyMeilisearchError } from '@tet/backend/utils/search-indexer/search-error.util';
import { SearchIndexerService } from '@tet/backend/utils/search-indexer/search-indexer.service';
import {
  type ActionSearchDoc,
  type ActionType,
  getActionTypeFromActionId,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { DefaultJobOptions, Job, Queue } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import { ACTION_INDEX, ACTION_INDEX_SETTINGS } from './action-index.constants';

/**
 * Nom de la queue BullMQ portant les jobs d'indexation Meilisearch des
 * actions / mesures (référentiel × collectivité). Co-localisé avec le service
 * par convention (cf. `SEARCH_INDEXING_PLAN_QUEUE_NAME`). Les noms de queues
 * ne vivent PAS dans `apps/backend/src/utils/bullmq/queue-names.constants.ts`.
 */
export const SEARCH_INDEXING_ACTION_QUEUE_NAME = 'search-indexing-action';

/**
 * Données portées par un job d'indexation d'action.
 *
 * Contrairement aux autres indexeurs (plan / fiche / indicateur), un document
 * "action" est indexé par paire `(actionId, collectiviteId)` — la clé primaire
 * Meilisearch est la chaîne composite `'${actionId}:${collectiviteId}'`. Les
 * jobs portent donc plusieurs formes :
 *
 *  - `upsert-pair` : (re)indexe un seul document — déclenché par les CRUD sur
 *    `action_commentaire`.
 *  - `delete-pair` : retire un seul document — usage rare (collectivité qui
 *    se désactive d'un référentiel ; ce flux n'existe pas en v1, mais on
 *    expose l'opération pour cohérence).
 *  - `fanout-referentiel` : ré-indexe TOUS les documents (action ×
 *    collectivité-activée) d'un référentiel — déclenché après une
 *    ré-importation via Google Sheets. Évite d'enfiler des millions de jobs
 *    unitaires : on dépile en lots de 500 directement dans le processeur.
 *  - `fanout-activation` : indexe les documents pour UNE collectivité × toutes
 *    les actions d'UN référentiel — déclenché lorsqu'une collectivité active
 *    un nouveau référentiel.
 */
export type ActionIndexerJobData =
  | { op: 'upsert-pair'; actionId: string; collectiviteId: number }
  | { op: 'delete-pair'; actionId: string; collectiviteId: number }
  | { op: 'fanout-referentiel'; referentielId: string }
  | {
      op: 'fanout-activation';
      referentielId: string;
      collectiviteId: number;
    };

/**
 * Taille de page utilisée par `indexAll()` pour parcourir
 * `action_definition`. Mêmes choix que `PlanIndexerService.indexAll()` : 500
 * correspond au lot par défaut côté Meilisearch
 * (`SEARCH_INDEXER_DEFAULT_BATCH_SIZE`).
 */
const INDEX_ALL_PAGE_SIZE = 500;

/**
 * Indexeur Meilisearch pour les actions de référentiel (UI : "Mesures").
 *
 * Les documents sont per-(action × collectivité activée), avec
 * dénormalisation du `commentaire` saisi par chaque collectivité dans
 * `action_commentaire`. La clé primaire Meilisearch est la chaîne composite
 * `'${actionId}:${collectiviteId}'`.
 *
 * **Signal d'activation choisi** : "la collectivité a au moins une ligne dans
 * `client_scores` pour le référentiel". C'est le signal canonique "engagée
 * sur ce référentiel" (alimenté par les fonctions PG d'évaluation de scores
 * lors de la première saisie d'un statut / commentaire / personnalisation).
 * Voir `client-scores.table.ts`.
 *
 * **Hooks instrumentés** :
 *   - `update-action-commentaire.service.ts` : après un upsert sur
 *     `action_commentaire`, on enfile `enqueueUpsertPair(actionId,
 *     collectiviteId)` pour rafraîchir le doc avec le nouveau commentaire
 *     (ou `null` si la mise à jour le supprime, cf. note ci-dessous).
 *   - `import-referentiel.service.ts` : après un `saveReferentiel`, on
 *     enfile `enqueueFanoutReferentiel(referentielId)`. Le processeur charge
 *     toutes les actions du référentiel × toutes les collectivités activées
 *     et bulk-upsert en lots de 500.
 *   - **TODO** : Hook d'activation. Il n'existe PAS aujourd'hui de
 *     point d'entrée applicatif clair pour "la collectivité X vient
 *     d'activer le référentiel R" (cf. ADR sur `client_scores` —
 *     l'insertion initiale est faite par les fonctions PG
 *     `evaluation.evaluate_regles` / `private.convert_client_scores`
 *     déclenchées lors du premier `computeScoreForCollectivite`). En
 *     pratique : la première saisie d'un commentaire passe déjà par
 *     `enqueueUpsertPair` (cf. `update-action-commentaire.service.ts`),
 *     ce qui couvre le cas du document "premier commentaire". Les
 *     documents "vides" (commentaire null) sur les *autres* actions du
 *     référentiel ne sont créés qu'au premier `fanout-referentiel`
 *     (re-import) ou via le backfill admin `mode: 'rebuild'` (U8).
 *     Identifier le hook propre — probablement dans
 *     `snapshots.service.ts#computeAndUpsert` après détection d'un
 *     premier `client_scores` row — est laissé pour un suivi.
 *
 * **Politique sur les suppressions de `action_commentaire`** : la table n'a
 * pas de flux de suppression production-side (le router expose seulement
 * `updateCommentaire`). Si un futur flux de suppression apparaît, il devra
 * appeler `enqueueUpsertPair` (PAS `enqueueDeletePair`) pour rafraîchir le
 * document avec `commentaire: null` plutôt que de le retirer — la mesure
 * reste découvrable pour la collectivité tant qu'elle est activée.
 */
@Injectable()
@Processor(SEARCH_INDEXING_ACTION_QUEUE_NAME)
export class ActionIndexerService
  extends WorkerHost
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(ActionIndexerService.name);

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
    @InjectQueue(SEARCH_INDEXING_ACTION_QUEUE_NAME)
    private readonly queue: Queue<ActionIndexerJobData>
  ) {
    super();
  }

  /**
   * Au démarrage du backend, on s'assure que l'index `actions` existe avec les
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
        ACTION_INDEX,
        ACTION_INDEX_SETTINGS
      );
    } catch (err) {
      this.logger.warn(
        `Échec de l'application des réglages pour l'index "${ACTION_INDEX}" au démarrage : ${getErrorMessage(
          err
        )}.`
      );
    }
  }

  /**
   * Pousse un job d'indexation `upsert-pair` pour la paire
   * `(actionId, collectiviteId)`. Le `jobId` est dérivé de l'opération + des
   * deux identifiants pour que BullMQ déduplique : si deux mutations
   * consécutives sur la même paire sont commit avant que la queue n'ait
   * commencé à traiter le premier job, seul un job survit (et le processeur
   * lira la ligne post-deuxième-commit).
   */
  async enqueueUpsertPair(
    actionId: string,
    collectiviteId: number
  ): Promise<void> {
    await this.queue.add(
      'upsert-pair',
      { op: 'upsert-pair', actionId, collectiviteId },
      { jobId: `actions:upsert:${actionId}:${collectiviteId}` }
    );
  }

  /**
   * Pousse un job d'indexation `delete-pair` pour la paire
   * `(actionId, collectiviteId)`. Cf. `enqueueUpsertPair` pour la stratégie
   * de `jobId`.
   *
   * Note : ce flux est rare en v1 — il existe surtout pour le cas hypothétique
   * d'une désactivation d'un référentiel. Les CRUD sur `action_commentaire`
   * passent par `enqueueUpsertPair`, jamais `enqueueDeletePair`.
   */
  async enqueueDeletePair(
    actionId: string,
    collectiviteId: number
  ): Promise<void> {
    await this.queue.add(
      'delete-pair',
      { op: 'delete-pair', actionId, collectiviteId },
      { jobId: `actions:delete:${actionId}:${collectiviteId}` }
    );
  }

  /**
   * Pousse un job `fanout-referentiel` après une (re-)importation d'un
   * référentiel. Le processeur expand cette opération en
   * (actions × collectivités-activées) docs et `bulkUpsert` en lots de 500.
   */
  async enqueueFanoutReferentiel(referentielId: string): Promise<void> {
    await this.queue.add(
      'fanout-referentiel',
      { op: 'fanout-referentiel', referentielId },
      { jobId: `actions:fanout-ref:${referentielId}` }
    );
  }

  /**
   * Pousse un job `fanout-activation` lorsqu'une collectivité active pour la
   * première fois un référentiel. Le processeur indexe un document
   * `commentaire: null` pour chaque action du référentiel × cette
   * collectivité.
   */
  async enqueueFanoutActivation(
    referentielId: string,
    collectiviteId: number
  ): Promise<void> {
    await this.queue.add(
      'fanout-activation',
      { op: 'fanout-activation', referentielId, collectiviteId },
      {
        jobId: `actions:fanout-act:${referentielId}:${collectiviteId}`,
      }
    );
  }

  /**
   * Réindexe la totalité des documents (action × collectivité-activée) vers
   * Meilisearch.
   *
   * Appelé par l'endpoint admin de backfill (U8). Pour chaque référentiel,
   * on charge la `hierarchie`, on liste toutes ses actions, on liste toutes
   * les collectivités activées (= ayant au moins une ligne dans
   * `client_scores`), on construit le produit cartésien (avec LEFT JOIN sur
   * `action_commentaire`) et on `bulkUpsert` en lots de
   * `INDEX_ALL_PAGE_SIZE`.
   *
   * @param targetIndex Nom de l'index Meilisearch cible. Par défaut on écrit
   *   vers `ACTION_INDEX` (l'index live). Le rebuild admin (U8 — `mode:
   *   'rebuild'`) passe ici le nom d'un index temporaire (`actions_v2`) pour
   *   préparer le swap atomique sans toucher l'index lu en production.
   */
  async indexAll(targetIndex: string = ACTION_INDEX): Promise<number> {
    const referentiels = await this.databaseService.db
      .select({
        id: referentielDefinitionTable.id,
        hierarchie: referentielDefinitionTable.hierarchie,
      })
      .from(referentielDefinitionTable);

    let totalIndexed = 0;
    for (const referentiel of referentiels) {
      const indexed = await this.fanoutReferentiel(
        referentiel.id,
        referentiel.hierarchie,
        targetIndex
      );
      totalIndexed += indexed;
    }

    this.logger.log(
      `indexAll: ${totalIndexed} document(s) indexé(s) vers "${targetIndex}" sur ${referentiels.length} référentiel(s)`
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
  async process(job: Job<ActionIndexerJobData>): Promise<void> {
    const data = job.data;
    this.logger.debug(
      `Processing ${data.op} job ${job.id} (attempt ${job.attemptsMade + 1})`
    );

    try {
      switch (data.op) {
        case 'delete-pair': {
          const id = `${data.actionId}:${data.collectiviteId}`;
          await this.searchIndexer.delete(ACTION_INDEX, id);
          return;
        }

        case 'upsert-pair': {
          const doc = await this.loadActionDoc(
            data.actionId,
            data.collectiviteId
          );
          if (!doc) {
            this.logger.debug(
              `Upsert job ${job.id} : action ${data.actionId} introuvable — no-op.`
            );
            return;
          }
          await this.searchIndexer.upsert(ACTION_INDEX, doc, {
            primaryKey: 'id',
          });
          return;
        }

        case 'fanout-referentiel': {
          const referentiel = await this.loadReferentielDefinition(
            data.referentielId
          );
          if (!referentiel) {
            this.logger.debug(
              `Fanout job ${job.id} : référentiel ${data.referentielId} introuvable — no-op.`
            );
            return;
          }
          const indexed = await this.fanoutReferentiel(
            referentiel.id,
            referentiel.hierarchie
          );
          this.logger.log(
            `fanout-referentiel ${data.referentielId}: ${indexed} doc(s) upserté(s)`
          );
          return;
        }

        case 'fanout-activation': {
          const referentiel = await this.loadReferentielDefinition(
            data.referentielId
          );
          if (!referentiel) {
            this.logger.debug(
              `Fanout-activation job ${job.id} : référentiel ${data.referentielId} introuvable — no-op.`
            );
            return;
          }
          const indexed = await this.fanoutCollectiviteOnReferentiel(
            referentiel.id,
            referentiel.hierarchie,
            data.collectiviteId
          );
          this.logger.log(
            `fanout-activation ${data.referentielId} × col ${data.collectiviteId}: ${indexed} doc(s) upserté(s)`
          );
          return;
        }
      }
    } catch (err) {
      this.logger.warn(
        `Échec du job ${data.op} (${job.id}) : ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      Sentry.captureException(err, {
        tags: {
          queue: SEARCH_INDEXING_ACTION_QUEUE_NAME,
          op: data.op,
        },
        extra: {
          jobId: job.id,
          attemptsMade: job.attemptsMade,
          ...data,
        },
      });
      throw classifyMeilisearchError(err);
    }
  }

  /**
   * Charge un seul `ActionSearchDoc` pour la paire `(actionId, collectiviteId)`.
   *
   * - JOIN `referentiel_definition` pour récupérer `hierarchie` (nécessaire
   *   au calcul du `type`).
   * - LEFT JOIN `action_commentaire` matché sur `action_id` et
   *   `collectivite_id` cible — `null` si la collectivité n'a pas encore
   *   commenté.
   *
   * Renvoie `null` si l'action n'existe pas ou si le calcul du `type` échoue
   * (e.g. action mal indexée hors hiérarchie).
   */
  private async loadActionDoc(
    actionId: string,
    collectiviteId: number
  ): Promise<ActionSearchDoc | null> {
    const [row] = await this.databaseService.db
      .select({
        actionId: actionDefinitionTable.actionId,
        referentielId: actionDefinitionTable.referentielId,
        nom: actionDefinitionTable.nom,
        description: actionDefinitionTable.description,
        hierarchie: referentielDefinitionTable.hierarchie,
        commentaire: actionCommentaireTable.commentaire,
      })
      .from(actionDefinitionTable)
      .innerJoin(
        referentielDefinitionTable,
        eq(referentielDefinitionTable.id, actionDefinitionTable.referentielId)
      )
      .leftJoin(
        actionCommentaireTable,
        and(
          eq(actionCommentaireTable.actionId, actionDefinitionTable.actionId),
          eq(actionCommentaireTable.collectiviteId, collectiviteId)
        )
      )
      .where(eq(actionDefinitionTable.actionId, actionId))
      .limit(1);

    if (!row) {
      return null;
    }

    let type;
    try {
      type = getActionTypeFromActionId(row.actionId, row.hierarchie);
    } catch (err) {
      this.logger.debug(
        `Impossible de calculer le type pour ${row.actionId}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return null;
    }

    return {
      id: `${row.actionId}:${collectiviteId}`,
      collectiviteId,
      actionId: row.actionId,
      referentielId: row.referentielId,
      type,
      nom: row.nom,
      description: row.description,
      commentaire: row.commentaire ?? null,
    };
  }

  private async loadReferentielDefinition(
    referentielId: string
  ): Promise<{ id: string; hierarchie: ActionType[] } | null> {
    const [row] = await this.databaseService.db
      .select({
        id: referentielDefinitionTable.id,
        hierarchie: referentielDefinitionTable.hierarchie,
      })
      .from(referentielDefinitionTable)
      .where(eq(referentielDefinitionTable.id, referentielId as ReferentielId))
      .limit(1);

    if (!row) {
      return null;
    }

    return { id: row.id, hierarchie: row.hierarchie };
  }

  /**
   * Implémentation partagée par `fanout-referentiel` et `indexAll()`.
   * Charge toutes les actions du référentiel + toutes les collectivités
   * activées (= au moins une ligne `client_scores` pour ce referentiel) puis
   * bulk-upsert le produit cartésien (avec dénormalisation du commentaire).
   *
   * Note de mémoire : (1500 actions × 500 collectivités = 750 000 docs) tient
   * sans difficulté en RAM côté Node (~150 Mo de JSON max). On charge
   * néanmoins les commentaires en `Map` pour éviter une lookup quadratique
   * lors de la construction des docs.
   */
  private async fanoutReferentiel(
    referentielId: string,
    hierarchie: ActionType[],
    targetIndex: string = ACTION_INDEX
  ): Promise<number> {
    const actions = await this.databaseService.db
      .select({
        actionId: actionDefinitionTable.actionId,
        nom: actionDefinitionTable.nom,
        description: actionDefinitionTable.description,
      })
      .from(actionDefinitionTable)
      .where(eq(actionDefinitionTable.referentielId, referentielId));

    if (actions.length === 0) {
      return 0;
    }

    const commentaires = await this.databaseService.db
      .select({
        actionId: actionCommentaireTable.actionId,
        collectiviteId: actionCommentaireTable.collectiviteId,
        commentaire: actionCommentaireTable.commentaire,
      })
      .from(actionCommentaireTable)
      .innerJoin(
        actionDefinitionTable,
        eq(actionDefinitionTable.actionId, actionCommentaireTable.actionId)
      )
      .where(and(eq(actionDefinitionTable.referentielId, referentielId)));

    const commentaireByKey = new Map<string, string>();
    const collectiviteIds = new Set<number>();
    for (const c of commentaires) {
      commentaireByKey.set(`${c.actionId}:${c.collectiviteId}`, c.commentaire);
      collectiviteIds.add(c.collectiviteId);
    }

    const docs: ActionSearchDoc[] = [];
    for (const action of actions) {
      let type;
      try {
        type = getActionTypeFromActionId(action.actionId, hierarchie);
      } catch (err) {
        this.logger.debug(
          `fanout: impossible de calculer le type pour ${
            action.actionId
          } — ignorée. Cause: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        continue;
      }
      for (const collectiviteId of collectiviteIds) {
        const compositeId = this.getActionCollectiviteCompositeId(
          action.actionId,
          collectiviteId
        );
        docs.push({
          id: compositeId,
          collectiviteId,
          actionId: action.actionId,
          referentielId,
          type,
          nom: action.nom,
          description: action.description,
          commentaire: commentaireByKey.get(compositeId) ?? null,
        });
      }
    }

    if (docs.length === 0) {
      return 0;
    }

    await this.searchIndexer.bulkUpsert(targetIndex, docs, {
      primaryKey: 'id',
      batchSize: INDEX_ALL_PAGE_SIZE,
    });
    return docs.length;
  }

  private getActionCollectiviteCompositeId(
    actionId: string,
    collectiviteId: number
  ): string {
    // Meilisearch only supports alphanumeric characters, underscores, and hyphens in composite primary keys
    return `${actionId.replace(/\./g, '-')}_${collectiviteId}`;
  }

  /**
   * Implémentation partagée par `fanout-activation` : indexe les documents
   * pour UNE collectivité × toutes les actions d'UN référentiel.
   */
  private async fanoutCollectiviteOnReferentiel(
    referentielId: string,
    hierarchie: ActionType[],
    collectiviteId: number
  ): Promise<number> {
    const actions = await this.databaseService.db
      .select({
        actionId: actionDefinitionTable.actionId,
        nom: actionDefinitionTable.nom,
        description: actionDefinitionTable.description,
      })
      .from(actionDefinitionTable)
      .where(eq(actionDefinitionTable.referentielId, referentielId));

    if (actions.length === 0) {
      return 0;
    }

    const commentaires = await this.databaseService.db
      .select({
        actionId: actionCommentaireTable.actionId,
        commentaire: actionCommentaireTable.commentaire,
      })
      .from(actionCommentaireTable)
      .innerJoin(
        actionDefinitionTable,
        eq(actionDefinitionTable.actionId, actionCommentaireTable.actionId)
      )
      .where(
        and(
          eq(actionDefinitionTable.referentielId, referentielId),
          eq(actionCommentaireTable.collectiviteId, collectiviteId)
        )
      );

    const commentaireByActionId = new Map<string, string>();
    for (const c of commentaires) {
      commentaireByActionId.set(c.actionId, c.commentaire);
    }

    const docs: ActionSearchDoc[] = [];
    for (const action of actions) {
      let type;
      try {
        type = getActionTypeFromActionId(action.actionId, hierarchie);
      } catch (err) {
        this.logger.debug(
          `fanout-activation: impossible de calculer le type pour ${
            action.actionId
          } — ignorée. Cause: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        continue;
      }
      docs.push({
        id: this.getActionCollectiviteCompositeId(
          action.actionId,
          collectiviteId
        ),
        collectiviteId,
        actionId: action.actionId,
        referentielId,
        type,
        nom: action.nom,
        description: action.description,
        commentaire: commentaireByActionId.get(action.actionId) ?? null,
      });
    }

    if (docs.length === 0) {
      return 0;
    }

    await this.searchIndexer.bulkUpsert(ACTION_INDEX, docs, {
      primaryKey: 'id',
      batchSize: INDEX_ALL_PAGE_SIZE,
    });
    return docs.length;
  }
}
