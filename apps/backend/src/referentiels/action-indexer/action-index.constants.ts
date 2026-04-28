import { FRENCH_LOCALIZED_ATTRIBUTES } from '@tet/backend/utils/search-indexer/french-tokenizer.constants';
import type { Settings } from 'meilisearch';

/**
 * Nom de l'index Meilisearch portant les actions / mesures du référentiel
 * (paires `action × collectivité activée`).
 *
 * Co-localisé avec le `ActionIndexerService`. Les autres indexeurs et le
 * proxy de lecture l'importent depuis ici.
 */
export const ACTION_INDEX = 'actions';

/**
 * Réglages Meilisearch pour l'index `actions`.
 *
 * Appliqués via `SearchIndexerService.ensureIndexSettings(...)` :
 *  - au démarrage, par `ActionIndexerService.onApplicationBootstrap` ;
 *  - à chaque rebuild administrateur (U8) sur l'index temporaire avant le swap.
 *
 * Documents par paire `(action × collectivité)` ; le filtre tenant côté
 * lecture est `collectiviteId = ${activeId}`. Le `commentaire` provient de
 * `action_commentaire` joint à `action_definition` au moment de l'indexation.
 */
export const ACTION_INDEX_SETTINGS: Settings = {
  searchableAttributes: ['nom', 'description', 'commentaire'],
  filterableAttributes: ['collectiviteId', 'referentielId', 'type'],
  localizedAttributes: FRENCH_LOCALIZED_ATTRIBUTES,
};
