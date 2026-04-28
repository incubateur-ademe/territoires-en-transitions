import { FRENCH_LOCALIZED_ATTRIBUTES } from '@tet/backend/utils/search-indexer/french-tokenizer.constants';
import type { Settings } from 'meilisearch';

/**
 * Nom de l'index Meilisearch portant les définitions d'indicateurs.
 *
 * Co-localisé avec le `IndicateurIndexerService`. Les autres indexeurs et le
 * proxy de lecture l'importent depuis ici.
 */
export const INDICATEUR_INDEX = 'indicateurs';

/**
 * Réglages Meilisearch pour l'index `indicateurs`.
 *
 * Appliqués via `SearchIndexerService.ensureIndexSettings(...)` :
 *  - au démarrage, par `IndicateurIndexerService.onApplicationBootstrap` ;
 *  - à chaque rebuild administrateur (U8) sur l'index temporaire avant le swap.
 *
 * `collectiviteId` est nullable côté DB (null = prédéfini / global, set =
 * personnalisé) ; le filtre tenant côté lecture est donc
 * `(collectiviteId IS NULL OR collectiviteId = ${activeId})`.
 */
export const INDICATEUR_INDEX_SETTINGS: Settings = {
  searchableAttributes: [
    'identifiantReferentiel',
    'titre',
    'titreLong',
    'description',
  ],
  filterableAttributes: ['collectiviteId', 'groupementId'],
  localizedAttributes: FRENCH_LOCALIZED_ATTRIBUTES,
};
