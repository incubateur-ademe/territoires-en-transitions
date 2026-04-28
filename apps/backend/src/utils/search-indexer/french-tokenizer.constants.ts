import type { Settings } from 'meilisearch';

/**
 * Configuration `localizedAttributes` partagée par tous les index Meilisearch.
 *
 * Tous les attributs textuels susceptibles de contenir du contenu en français
 * sont déclarés ici afin que Meilisearch applique le tokenizer français
 * (gestion des accents, segmentation, stop-words). Le pattern `titre_*` couvre
 * notamment `titre_long` pour les indicateurs.
 *
 * Cette config est volontairement transverse — elle dépend de la langue des
 * données métier (français) et non d'un domaine particulier — donc on la garde
 * à côté du wrapper SDK plutôt que de la dupliquer dans chaque
 * `<domain>-index.constants.ts`.
 */
export const FRENCH_LOCALIZED_ATTRIBUTES: NonNullable<
  Settings['localizedAttributes']
> = [
  {
    attributePatterns: [
      'titre',
      'titre_*',
      'nom',
      'description',
      'commentaire',
      'filename',
    ],
    locales: ['fra'],
  },
];
