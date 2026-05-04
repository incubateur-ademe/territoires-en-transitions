import { FRENCH_LOCALIZED_ATTRIBUTES } from '@tet/backend/utils/search-indexer/french-tokenizer.constants';
import type { Settings } from 'meilisearch';

/**
 * Nom de l'index Meilisearch portant les fiches actions / sous-actions.
 *
 * Co-localisé avec le `FicheIndexerService`. Les autres indexeurs et le proxy
 * de lecture l'importent depuis ici.
 */
export const FICHE_INDEX = 'fiches';

/**
 * Réglages Meilisearch pour l'index `fiches`.
 *
 * Appliqués via `SearchIndexerService.ensureIndexSettings(...)` :
 *  - au démarrage, par `FicheIndexerService.onApplicationBootstrap` ;
 *  - à chaque rebuild administrateur (U8) sur l'index temporaire avant le swap.
 *
 * `visibleCollectiviteIds` est multi-valued (`[ownerCollectiviteId,
 * ...sharingCollectiviteIds]`) et porte le filtre tenant côté lecture (U7).
 * `parentId` permet la distinction Action (parentId IS NULL) /
 * Sous-action (parentId IS NOT NULL).
 */
export const FICHE_INDEX_SETTINGS: Settings = {
  searchableAttributes: ['titre', 'description'],
  filterableAttributes: ['visibleCollectiviteIds', 'parentId'],
  localizedAttributes: FRENCH_LOCALIZED_ATTRIBUTES,
};
