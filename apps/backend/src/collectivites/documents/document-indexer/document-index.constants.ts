import { FRENCH_LOCALIZED_ATTRIBUTES } from '@tet/backend/utils/search-indexer/french-tokenizer.constants';
import type { Settings } from 'meilisearch';

/**
 * Nom de l'index Meilisearch portant les fichiers de la bibliothèque
 * (`bibliotheque_fichier`).
 *
 * Co-localisé avec le `DocumentIndexerService`. Les autres indexeurs et le
 * proxy de lecture l'importent depuis ici.
 */
export const DOCUMENT_INDEX = 'documents';

/**
 * Réglages Meilisearch pour l'index `documents`.
 *
 * Appliqués via `SearchIndexerService.ensureIndexSettings(...)` :
 *  - au démarrage, par `DocumentIndexerService.onApplicationBootstrap` ;
 *  - à chaque rebuild administrateur (U8) sur l'index temporaire avant le swap.
 *
 * `collectiviteId` est nullable côté DB (null = global / système, set =
 * appartient à une collectivité) ; le filtre tenant côté lecture est donc
 * `(collectiviteId IS NULL OR collectiviteId = ${activeId})`.
 */
export const DOCUMENT_INDEX_SETTINGS: Settings = {
  searchableAttributes: ['filename'],
  filterableAttributes: ['collectiviteId'],
  localizedAttributes: FRENCH_LOCALIZED_ATTRIBUTES,
};
