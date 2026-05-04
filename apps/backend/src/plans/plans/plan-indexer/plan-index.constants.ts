import { FRENCH_LOCALIZED_ATTRIBUTES } from '@tet/backend/utils/search-indexer/french-tokenizer.constants';
import type { Settings } from 'meilisearch';

/**
 * Nom de l'index Meilisearch portant les plans / axes.
 *
 * Co-localisé avec le `PlanIndexerService` parce que la connaissance "ce qui
 * est indexé sous le nom `plans`" est par nature un détail du domaine plans —
 * les autres indexeurs et le proxy de lecture l'importent depuis ici.
 */
export const PLAN_INDEX = 'plans';

/**
 * Réglages Meilisearch pour l'index `plans`.
 *
 * Appliqués via `SearchIndexerService.ensureIndexSettings(...)` :
 *  - au démarrage, par `PlanIndexerService.onApplicationBootstrap` — c'est ce
 *    qui crée l'index s'il n'existe pas et fixe les attributs searchable /
 *    filterable + le tokenizer français ;
 *  - à chaque rebuild administrateur (U8) sur l'index temporaire avant le swap.
 *
 * L'ordre des `searchableAttributes` est significatif : un attribut placé en
 * tête a un poids plus élevé dans le ranking de Meilisearch.
 */
export const PLAN_INDEX_SETTINGS: Settings = {
  searchableAttributes: ['nom'],
  filterableAttributes: ['collectiviteId', 'parent'],
  localizedAttributes: FRENCH_LOCALIZED_ATTRIBUTES,
};
