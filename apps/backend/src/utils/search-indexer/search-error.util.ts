import { UnrecoverableError } from 'bullmq';
import { MeilisearchApiError } from 'meilisearch';
import type { MeilisearchErrorResponse, Task } from 'meilisearch';

/**
 * Levée par `SearchIndexerService.waitForTask(...)` lorsque la tâche
 * Meilisearch atteint un état terminal autre que `succeeded` (typiquement
 * `failed` ou `canceled`).
 *
 * Le SDK Meilisearch ne lève rien dans ce cas : `waitForTask` se contente
 * de retourner le `Task` une fois sa `status` sortie de
 * `enqueued`/`processing`. Sans wrapping, une indexation qui échoue
 * silencieusement passe inaperçue (cf. logs Meilisearch type "A batch of
 * tasks was successfully completed with 0 successful tasks and 1 failed
 * tasks"). Cette classe matérialise l'échec côté Node pour que la chaîne
 * de classification d'erreur s'applique normalement (BullMQ retry vs
 * UnrecoverableError selon le `code`).
 *
 * Le champ `cause` reprend la même forme que `MeilisearchApiError.cause`
 * (`MeilisearchErrorResponse`) — `classifyMeilisearchError` lit le `code`
 * indifféremment pour les deux types.
 */
export class MeilisearchTaskFailedError extends Error {
  override readonly name = 'MeilisearchTaskFailedError';
  readonly taskUid: number;
  readonly taskStatus: Task['status'];
  override readonly cause: MeilisearchErrorResponse | null;

  constructor(task: Task) {
    const code = task.error?.code ?? 'unknown_code';
    const detail = task.error?.message ?? `(no error message; status=${task.status})`;
    super(`Meilisearch task ${task.uid} ${task.status} [${code}]: ${detail}`);
    this.taskUid = task.uid;
    this.taskStatus = task.status;
    this.cause = task.error ?? null;
  }
}

/**
 * Codes d'erreur Meilisearch que l'on considère définitifs : retenter le job
 * ne servira à rien tant que l'opérateur n'aura pas corrigé la cause (clé API
 * invalide, document mal formé, filtre invalide, etc.). On les remonte donc
 * comme `UnrecoverableError` afin que BullMQ ne réessaie pas et que le job
 * apparaisse dans la liste des échecs définitifs sur Bull-Board.
 *
 * Référence des codes : https://www.meilisearch.com/docs/reference/errors/error_codes
 */
const PERMANENT_MEILISEARCH_ERROR_CODES = new Set<string>([
  'invalid_api_key',
  'missing_authorization_header',
  'index_not_found',
  'invalid_document_id',
  'invalid_filter',
  'invalid_index_uid',
  'document_fields_limit_reached',
  'payload_too_large',
]);

/**
 * Préfixes de codes d'erreur Meilisearch permanents.
 *
 * Plusieurs familles partagent un préfixe (`invalid_settings_*`, `immutable_*`)
 * et il est plus robuste de matcher le préfixe que d'énumérer chaque variante :
 * Meilisearch en ajoute régulièrement.
 */
const PERMANENT_MEILISEARCH_ERROR_CODE_PREFIXES = [
  'invalid_settings_',
  'immutable_',
] as const;

/**
 * Classifie une erreur remontée par le SDK Meilisearch.
 *
 * On reconnaît deux types d'erreurs structurées exposant un `cause.code`
 * compatible avec la table de codes Meilisearch :
 *  - `MeilisearchApiError` (échec HTTP synchrone — clé API invalide,
 *    document mal formé, etc.) ;
 *  - `MeilisearchTaskFailedError` (tâche async qui a fini en `failed` /
 *    `canceled` côté serveur — surface explicite des "0 successful / 1
 *    failed" qu'on voit dans les logs Meilisearch).
 *
 * On switche EXCLUSIVEMENT sur le `cause.code`, jamais sur le texte du
 * message — les messages sont localisés et changent entre versions, alors
 * que les codes sont stables.
 *
 * - Code permanent (clé API, document mal formé, filtre invalide…) →
 *   `UnrecoverableError` que l'appelant `throw` pour indiquer à BullMQ de
 *   ne pas retenter.
 * - Erreur API Meilisearch retryable (5xx, `too_many_*`, `remote_timeout`,
 *   `internal`) → erreur d'origine renvoyée pour que BullMQ retente avec
 *   backoff.
 * - Erreurs réseau / timeout (`MeilisearchRequestError`,
 *   `MeilisearchRequestTimeOutError`, `MeilisearchTaskTimeOutError`) →
 *   erreur d'origine renvoyée (retryable).
 * - Tout autre `Error` → renvoyé tel quel (retryable par défaut).
 * - Valeur non-`Error` → emballée dans un `Error` générique (retryable).
 *
 * @param err Erreur capturée
 * @returns L'erreur à `throw` : un `UnrecoverableError` pour les cas permanents,
 *          l'erreur d'origine pour les cas retryables.
 */
export function classifyMeilisearchError(err: unknown): Error {
  if (
    err instanceof MeilisearchApiError ||
    err instanceof MeilisearchTaskFailedError
  ) {
    const code = err.cause?.code;
    if (code && isPermanentMeilisearchErrorCode(code)) {
      const wrapped = new UnrecoverableError(
        `Meilisearch permanent error [${code}]: ${err.message}`
      );
      if (err.stack) {
        wrapped.stack = err.stack;
      }
      return wrapped;
    }
    return err;
  }

  if (err instanceof Error) {
    return err;
  }

  return new Error(String(err));
}

function isPermanentMeilisearchErrorCode(code: string): boolean {
  if (PERMANENT_MEILISEARCH_ERROR_CODES.has(code)) {
    return true;
  }
  return PERMANENT_MEILISEARCH_ERROR_CODE_PREFIXES.some((prefix) =>
    code.startsWith(prefix)
  );
}
