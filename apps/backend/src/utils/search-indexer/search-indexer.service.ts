import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { getErrorMessage } from '@tet/domain/utils';
import { chunk } from 'es-toolkit';
import {
  type EnqueuedTask,
  type Health,
  type IndexSwap,
  Meilisearch,
  MeilisearchApiError,
  type MultiSearchParams,
  type MultiSearchResponse,
  type Settings,
} from 'meilisearch';
import ConfigurationService from '../config/configuration.service';
import { MeilisearchTaskFailedError } from './search-error.util';

/**
 * Taille maximale d'un lot pour `bulkUpsert` / `bulkDelete`.
 *
 * Meilisearch accepte des payloads volumineux mais découper en lots permet
 * (a) de respecter `payload_too_large` sur des documents larges,
 * (b) de ne pas saturer la mémoire côté Node, et
 * (c) de progresser de manière incrémentale sur les rebuilds (U8).
 */
export const SEARCH_INDEXER_DEFAULT_BATCH_SIZE = 500;

/**
 * Timeout par défaut pour l'attente de complétion d'un lot bulkUpsert
 * côté Meilisearch (en millisecondes).
 *
 * 10 minutes — calibré pour le pire cas d'un rebuild admin sur l'index
 * `actions` (~millions de docs si beaucoup de collectivités activées sur
 * tous les référentiels) sans bloquer indéfiniment si le moteur est en
 * panne. Pour les opérations live (write-path single-doc), on n'utilise
 * PAS ce wait — cf. `upsert()` qui retourne dès que le task est enfilé.
 */
const BULK_UPSERT_WAIT_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Nom de la clé primaire par défaut pour tous les indexes du projet.
 *
 * Tous les `*DocSchema` exposent un champ `id` (numérique pour
 * plans/fiches/indicateurs/documents, string composite pour `actions`).
 * Sans hint explicite, Meilisearch tente de l'inférer ; comme tous nos
 * documents ont aussi des champs `collectivite_id`, `parent_id`,
 * `referentiel_id`, etc. qui se terminent par `id`, l'inférence échoue
 * avec :
 *
 *   "The primary key inference failed as the engine found N fields
 *    ending with 'id' in their names: '...'. Please specify the primary
 *    key manually using the primaryKey query parameter."
 *
 * On force donc `'id'` partout (création d'index ET addDocuments).
 */
const DEFAULT_PRIMARY_KEY = 'id';

export interface SearchIndexerBulkOptions {
  /** Taille de lot. Par défaut {@link SEARCH_INDEXER_DEFAULT_BATCH_SIZE}. */
  batchSize?: number;
}

export interface SearchIndexerUpsertOptions {
  /** Nom du champ utilisé comme clé primaire (défaut Meilisearch : `id`). */
  primaryKey?: string;
}

export interface SearchIndexerBulkDeleteByFilter {
  /**
   * Filtre Meilisearch (`AND`/`OR`/`=`/`IN [...]`...) pour sélectionner les
   * documents à supprimer. Voir
   * https://www.meilisearch.com/docs/reference/api/documents#delete-documents-by-filter
   */
  filter: string | string[];
}

/**
 * Wrapper fin autour du SDK Meilisearch.
 *
 * Aucune connaissance métier ici : ce service expose juste un sous-ensemble
 * stable de l'API Meilisearch (upsert/delete/multiSearch/swapIndexes/settings)
 * + un `bulkUpsert` qui découpe en lots. Les indexeurs par domaine
 * (`PlanIndexerService`, `FicheIndexerService`, ...) en dépendent et y
 * ajoutent la logique de chargement des documents.
 *
 * Le SDK Meilisearch est purement HTTP, il n'y a pas de connexion à établir :
 * le constructeur instancie le client immédiatement. À l'amorçage de
 * l'application on tente un `health()` purement informatif — une panne
 * Meilisearch au boot ne doit PAS faire crasher le backend, sinon le moindre
 * incident sur l'index empêcherait toute autre fonctionnalité de répondre.
 */
@Injectable()
export class SearchIndexerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SearchIndexerService.name);
  private readonly client: Meilisearch;

  constructor(private readonly config: ConfigurationService) {
    const host = this.config.get('MEILI_HOST');
    const apiKey = this.config.get('MEILI_API_KEY');

    this.client = new Meilisearch({
      host: host as string,
      apiKey: apiKey as string,
    });
  }

  /**
   * Au démarrage, on logge l'état de santé de Meilisearch à titre informatif.
   *
   * Toute erreur est *loguée* mais NE doit PAS faire échouer le bootstrap :
   * Meilisearch est une dépendance externe, son indisponibilité doit être
   * tolérée.
   *
   * L'application des réglages par index (`ensureIndexSettings`) ne vit PAS
   * ici — chaque indexeur de domaine (`PlanIndexerService`,
   * `FicheIndexerService`, …) implémente lui-même `OnApplicationBootstrap`
   * et applique ses propres réglages. Cf. `doc/plans/2026-04-28-002-refactor-per-domain-index-bootstrap-plan.md`.
   */
  async onApplicationBootstrap(): Promise<void> {
    try {
      const status = await this.health();
      this.logger.log(`Meilisearch health status: ${status.status}`);
    } catch (err) {
      this.logger.warn(
        `Impossible de joindre Meilisearch au démarrage : ${getErrorMessage(
          err
        )}. Le backend démarre quand même ; les jobs d'indexation retenteront en backoff.`
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Pas de socket persistante à fermer côté SDK Meilisearch (HTTP).
    // On garde le hook pour symétrie avec d'autres services.
  }

  /**
   * Retourne l'état de santé du cluster Meilisearch.
   * Utilisé par le bootstrap et exposé pour les health-checks éventuels.
   */
  async health(): Promise<Health> {
    return this.client.health();
  }

  /**
   * Insère ou met à jour un seul document dans `indexName`.
   *
   * Meilisearch crée automatiquement l'index si nécessaire ; cependant les
   * réglages (searchable / filterable) ne seront pas appliqués tant que
   * `ensureIndexSettings` n'a pas tourné — d'où le bootstrap idempotent.
   *
   * `primaryKey` défaut `'id'` — voir `DEFAULT_PRIMARY_KEY` pour la
   * justification (sans hint, l'inférence Meilisearch échoue parce que
   * tous nos documents ont plusieurs champs se terminant par `_id`).
   */
  async upsert<TDoc extends Record<string, unknown>>(
    indexName: string,
    doc: TDoc,
    opts: SearchIndexerUpsertOptions = {}
  ): Promise<EnqueuedTask> {
    return this.client.index(indexName).addDocuments([doc], {
      primaryKey: opts.primaryKey ?? DEFAULT_PRIMARY_KEY,
    });
  }

  /**
   * Insère ou met à jour une liste de documents en lots, ET attend que
   * **chaque** lot soit appliqué côté Meilisearch avant d'enchaîner sur le
   * suivant.
   *
   * On attend lot par lot (plutôt que d'enfiler tous les `addDocuments` puis
   * d'attendre uniquement le dernier task) pour deux raisons :
   *  - **Observabilité** : un échec ne se cache pas derrière les lots
   *    suivants ; il sort exactement au bon `chunkIndex`.
   *  - **Lisibilité** : un log par lot rend le progrès visible côté
   *    opérateur sur les rebuilds longs (U8) — utile quand on indexe ~750k
   *    docs `(action × collectivité)` et qu'on veut savoir où on en est.
   *
   * Le coût : on perd le pipelining côté Meilisearch (les lots ne se
   * chevauchent plus). Acceptable pour le flow admin et largement
   * compensé par la traçabilité ; le write-path live n'utilise pas
   * `bulkUpsert` (les CRUD utilisateurs passent par `upsert`).
   *
   * À la sortie de cette méthode, les documents sont effectivement
   * *searchable*.
   */
  async bulkUpsert<TDoc extends Record<string, unknown>>(
    indexName: string,
    docs: TDoc[],
    opts: SearchIndexerUpsertOptions & SearchIndexerBulkOptions = {}
  ): Promise<EnqueuedTask[]> {
    if (docs.length === 0) {
      return [];
    }
    const batchSize = opts.batchSize ?? SEARCH_INDEXER_DEFAULT_BATCH_SIZE;
    const primaryKey = opts.primaryKey ?? DEFAULT_PRIMARY_KEY;
    const index = this.client.index(indexName);

    const batches = chunk(docs, batchSize);
    const tasks: EnqueuedTask[] = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const task = await index.addDocuments(batch, { primaryKey });
      await this.waitForTask(task.taskUid, BULK_UPSERT_WAIT_TIMEOUT_MS);
      tasks.push(task);
      this.logger.log(
        `bulkUpsert "${indexName}": chunk ${i + 1}/${batches.length} (${
          batch.length
        } doc(s)) appliqué`
      );
    }

    return tasks;
  }

  /**
   * Supprime un document par sa clé primaire.
   */
  async delete(indexName: string, id: string | number): Promise<EnqueuedTask> {
    return this.client.index(indexName).deleteDocument(id);
  }

  /**
   * Supprime plusieurs documents, soit par liste d'identifiants, soit par
   * filtre (les deux modes sont supportés par le même endpoint Meilisearch
   * `delete-batch` / `delete-by-filter`).
   */
  async bulkDelete(
    indexName: string,
    target: string[] | number[] | SearchIndexerBulkDeleteByFilter
  ): Promise<EnqueuedTask> {
    const index = this.client.index(indexName);
    if (Array.isArray(target)) {
      // Le SDK accepte `string[]` OU `number[]` (pas un mix), ce qui matche
      // les clés primaires des index : numériques pour plans/fiches/etc.,
      // string pour `actions` (clé composite "actionId:collectiviteId").
      return index.deleteDocuments(target);
    }
    return index.deleteDocuments({ filter: target.filter });
  }

  /**
   * Lance plusieurs requêtes de recherche en parallèle côté Meilisearch via
   * l'endpoint `multi-search`. Utilisé par le proxy de lecture (U7) pour
   * interroger les 5 index en une seule requête HTTP.
   *
   * On accepte uniquement la forme `MultiSearchParams` (non fédérée) — le
   * proxy U7 a besoin de buckets séparés par index, pas d'une fusion globale.
   */
  async multiSearch<
    T extends Record<string, unknown> = Record<string, unknown>
  >(queries: MultiSearchParams): Promise<MultiSearchResponse<T>> {
    return this.client.multiSearch<MultiSearchParams, T>(queries);
  }

  /**
   * Échange atomiquement plusieurs paires d'index. Utilisé par la procédure
   * de rebuild administrateur (U8) : on indexe vers `plans_temp` puis on swap
   * `plans` ↔ `plans_temp` sans temps mort visible côté lecture.
   */
  async swapIndexes(pairs: IndexSwap[]): Promise<EnqueuedTask> {
    return this.client.swapIndexes(pairs);
  }

  /**
   * Supprime intégralement un index Meilisearch (et tous ses documents).
   *
   * Utilisé par le rebuild admin (U8) pour purger l'ancien index temporaire
   * une fois que `swapIndexes` a basculé son contenu vers le nom canonique.
   * On renvoie l'`EnqueuedTask` pour que l'appelant puisse `waitForTask` si
   * besoin avant de relâcher le verrou Redis.
   *
   * Note : si l'index n'existe pas, Meilisearch renvoie une erreur
   * `index_not_found` ; on ne la rattrape PAS ici — c'est à l'appelant de
   * décider si l'absence est attendue (idempotence) ou anormale.
   */
  async deleteIndex(indexName: string): Promise<EnqueuedTask> {
    return this.client.deleteIndex(indexName);
  }

  /**
   * Attend la complétion d'une tâche Meilisearch (les opérations
   * `addDocuments` / `deleteDocuments` / `updateSettings` sont asynchrones
   * côté serveur et renvoient juste un `taskUid`).
   *
   * **Important** : le SDK Meilisearch retourne le `Task` dès que son
   * `status` sort de `enqueued`/`processing` — y compris pour les `failed`
   * et `canceled` qu'il NE LÈVE PAS. Sans wrapping, une indexation qui
   * échoue silencieusement passerait inaperçue (cf. logs Meilisearch type
   * "A batch of tasks was successfully completed with 0 successful tasks
   * and 1 failed tasks"). On vérifie donc explicitement le statut final et
   * on lève `MeilisearchTaskFailedError` dans les cas non-`succeeded` —
   * ce qui rebrancha la chaîne `classifyMeilisearchError` (le `cause.code`
   * dérivé du `task.error` est utilisé pour décider retryable vs permanent).
   *
   * Utilisé par `bulkUpsert` (admin reindex), par le rebuild admin (U8) qui
   * doit s'assurer que l'indexation vers le temp index est terminée avant
   * le swap, et par les tests.
   *
   * @throws MeilisearchTaskFailedError si la tâche se termine en `failed` ou
   *   `canceled`. La cause structurée (`task.error`) est exposée via
   *   `err.cause` pour que `classifyMeilisearchError` puisse la lire.
   */
  async waitForTask(taskUid: number, timeoutMs = 30_000): Promise<void> {
    // Le SDK Meilisearch expose `client.tasks.waitForTask(uid, { timeout })`
    // (timeout en millisecondes). Pas de méthode équivalente directement sur
    // le client racine en v0.57+.
    const task = await this.client.tasks.waitForTask(taskUid, {
      timeout: timeoutMs,
    });
    if (task.status !== 'succeeded') {
      // Logge la cause structurée AVANT de lever — sinon Sentry / Bull-Board
      // n'a que le message de l'`Error` et l'opérateur perd le `code`.
      this.logger.warn(
        `Meilisearch task ${task.uid} ${task.status}: ${
          task.error?.message ?? '(no error message)'
        } [${task.error?.code ?? 'unknown_code'}]`
      );
      throw new MeilisearchTaskFailedError(task);
    }
  }

  /**
   * Crée l'index si besoin et lui applique les `settings` fournis.
   *
   * `getOrCreateIndex` est implémenté en deux temps :
   *  1. on tente `getRawIndex` ; s'il échoue avec `index_not_found` on
   *     `createIndex` ;
   *  2. puis on `updateSettings` — qui est idempotent côté Meilisearch
   *     (réappliquer les mêmes réglages est un no-op rapide).
   */
  async ensureIndexSettings(
    indexName: string,
    settings: Settings
  ): Promise<EnqueuedTask> {
    await this.ensureIndexExists(indexName);
    return this.client.index(indexName).updateSettings(settings);
  }

  private async ensureIndexExists(indexName: string): Promise<void> {
    try {
      await this.client.getRawIndex(indexName);
    } catch (err) {
      if (this.isIndexNotFound(err)) {
        this.logger.log(
          `Index "${indexName}" not found, creating it with primaryKey "${DEFAULT_PRIMARY_KEY}"...`
        );
        // On fixe la primaryKey à la création — sinon Meilisearch tentera
        // de l'inférer du premier document et échouera (cf.
        // `DEFAULT_PRIMARY_KEY` pour la justification).
        await this.client.createIndex(indexName, {
          primaryKey: DEFAULT_PRIMARY_KEY,
        });
        return;
      }
      throw err;
    }
  }

  /**
   * Type-guard sur les erreurs `MeilisearchApiError` portant le code
   * `index_not_found`.
   *
   * Le SDK Meilisearch ne pose PAS le code directement sur l'erreur en
   * v0.57+ : il lit le payload de la réponse JSON et le stocke comme
   * `cause` (`{ message, code, type, link }`). On filtre donc d'abord par
   * `instanceof MeilisearchApiError` pour avoir un type narrowed, puis on
   * lit `err.cause?.code`. Toute autre erreur (réseau, timeout, exception
   * non-Meilisearch) ressort `false` et est repropagée par l'appelant.
   */
  private isIndexNotFound(err: unknown): err is MeilisearchApiError {
    return (
      err instanceof MeilisearchApiError &&
      err.cause?.code === 'index_not_found'
    );
  }
}
